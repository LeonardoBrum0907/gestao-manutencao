import { randomBytes, timingSafeEqual } from "crypto";
import { Injectable } from "@nestjs/common";
import type { Response } from "express";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import { AccessDeniedError, InvalidGrantError, InvalidTokenError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type { AuthorizationParams, OAuthServerProvider } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { OAuthClientInformationFull, OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import { EnvService } from "../../env.module";
import { GESTOR_EMAIL, GESTOR_PASSWORD } from "../../identity/domain/gestor-account";
import { hashSessionToken } from "../../identity/domain/session-token";
import { PasswordHasher } from "../../identity/infra/password.hasher";
import { UserRepository } from "../../identity/infra/user.repository";
import { AuthorizationCodes } from "../domain/authorization-codes";
import { LoginAttempts } from "../domain/login-attempts";
import { renderLoginPage } from "../http/login-page";
import { McpOAuthRepository } from "../infra/mcp-oauth.repository";

const ACCESS_TTL_SEC = 60 * 60;
const REFRESH_TTL_SEC = 30 * 24 * 60 * 60;
// A chave fixa do .env não vence; o SDK exige uma data, então vai uma bem longe.
const STATIC_TOKEN_EXPIRES_AT = 4_102_444_800;
export const STATIC_TOKEN_CLIENT = "chave-fixa";

type LoginForm = { decision?: unknown; password?: unknown };

// O form-action do CSP vale também para o redirecionamento que vem depois do envio: sem a origem
// do retorno (já conferida pelo SDK contra o cadastro do cliente), o navegador barra a volta ao app.
// Endereço de app nativo (cursor://...) não tem origem, então vai só o esquema.
export function redirectSource(redirectUri: string): string {
  const url = new URL(redirectUri);
  return url.origin === "null" ? url.protocol : url.origin;
}

@Injectable()
export class McpOAuthProvider implements OAuthServerProvider {
  private readonly codes = new AuthorizationCodes();
  private readonly attempts = new LoginAttempts();

  constructor(
    private readonly repository: McpOAuthRepository,
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
    private readonly env: EnvService,
  ) {}

  get clientsStore(): OAuthRegisteredClientsStore {
    return {
      getClient: async (clientId) => {
        const data = await this.repository.findClient(clientId);
        return (data as OAuthClientInformationFull | null) ?? undefined;
      },
      registerClient: async (client) => {
        const full = client as OAuthClientInformationFull;
        await this.repository.saveClient(full.client_id, full);
        return full;
      },
    };
  }

  async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
    const request = res.req;
    const form: LoginForm = request.method === "POST" && request.body && typeof request.body === "object" ? request.body : {};
    if (form.decision === "deny") throw new AccessDeniedError("O gestor cancelou a conexão.");
    if (form.decision !== "allow") {
      this.page(res, client, params, null);
      return;
    }
    const now = Date.now();
    const locked = this.attempts.lockedFor(now);
    if (locked) {
      this.page(res, client, params, `Muitas tentativas erradas. Tente de novo em ${Math.ceil(locked / 60_000)} minutos.`);
      return;
    }
    const password = typeof form.password === "string" ? form.password : "";
    const user = await this.users.findByEmail(GESTOR_EMAIL);
    const valid = user && password ? await this.passwords.verify(user.passwordHash, password) : false;
    if (!user || !valid) {
      this.attempts.fail(now);
      this.page(res, client, params, "Senha não confere.");
      return;
    }
    // A senha que vem no código é pública; sem trocar, ninguém liga uma IA com poder de lançar.
    if (password === GESTOR_PASSWORD) {
      this.page(res, client, params, "A senha do gestor ainda é a padrão. Defina GESTOR_PASSWORD no .env do servidor, reinicie a API e entre com a nova.");
      return;
    }
    this.attempts.succeed();
    const code = this.codes.issue(
      {
        clientId: client.client_id,
        codeChallenge: params.codeChallenge,
        redirectUri: params.redirectUri,
        scopes: params.scopes ?? [],
        resource: params.resource?.href ?? null,
      },
      now,
    );
    const target = new URL(params.redirectUri);
    target.searchParams.set("code", code);
    if (params.state !== undefined) target.searchParams.set("state", params.state);
    res.redirect(302, target.href);
  }

  async challengeForAuthorizationCode(client: OAuthClientInformationFull, authorizationCode: string): Promise<string> {
    const entry = this.codes.peek(authorizationCode, client.client_id, Date.now());
    if (!entry) throw new InvalidGrantError("Código inválido ou vencido.");
    return entry.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    redirectUri?: string,
  ): Promise<OAuthTokens> {
    const entry = this.codes.take(authorizationCode, client.client_id, Date.now());
    if (!entry) throw new InvalidGrantError("Código inválido ou vencido.");
    if (redirectUri !== undefined && redirectUri !== entry.redirectUri) {
      throw new InvalidGrantError("Endereço de retorno diferente do usado no login.");
    }
    return this.issueTokens(client.client_id, entry.scopes);
  }

  async exchangeRefreshToken(client: OAuthClientInformationFull, refreshToken: string, scopes?: string[]): Promise<OAuthTokens> {
    const hash = this.hash(refreshToken);
    const stored = await this.repository.findToken(hash);
    if (!stored || stored.kind !== "refresh" || stored.clientId !== client.client_id || stored.expiresAt <= new Date()) {
      throw new InvalidGrantError("Renovação inválida ou vencida.");
    }
    if (!(await this.repository.takeToken(hash))) throw new InvalidGrantError("Renovação já usada.");
    const granted = scopes?.length ? scopes.filter((scope) => stored.scopes.includes(scope)) : stored.scopes;
    return this.issueTokens(client.client_id, granted);
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    if (this.isStaticToken(token)) {
      return { token, clientId: STATIC_TOKEN_CLIENT, scopes: [], expiresAt: STATIC_TOKEN_EXPIRES_AT };
    }
    const stored = await this.repository.findToken(this.hash(token));
    if (!stored || stored.kind !== "access" || stored.expiresAt <= new Date()) {
      throw new InvalidTokenError("Chave inválida ou vencida.");
    }
    return {
      token,
      clientId: stored.clientId,
      scopes: stored.scopes,
      expiresAt: Math.floor(stored.expiresAt.getTime() / 1000),
    };
  }

  async revokeToken(client: OAuthClientInformationFull, request: { token: string }): Promise<void> {
    const hash = this.hash(request.token);
    const stored = await this.repository.findToken(hash);
    if (stored && stored.clientId === client.client_id) await this.repository.takeToken(hash);
  }

  private async issueTokens(clientId: string, scopes: string[]): Promise<OAuthTokens> {
    const now = Date.now();
    const access = randomBytes(32).toString("hex");
    const refresh = randomBytes(32).toString("hex");
    await Promise.all([
      this.repository.saveToken(this.hash(access), { clientId, kind: "access", scopes, expiresAt: new Date(now + ACCESS_TTL_SEC * 1000) }),
      this.repository.saveToken(this.hash(refresh), { clientId, kind: "refresh", scopes, expiresAt: new Date(now + REFRESH_TTL_SEC * 1000) }),
    ]);
    void this.repository.deleteExpired(new Date(now)).catch(() => undefined);
    return {
      access_token: access,
      token_type: "bearer",
      expires_in: ACCESS_TTL_SEC,
      refresh_token: refresh,
      scope: scopes.length ? scopes.join(" ") : undefined,
    };
  }

  private isStaticToken(token: string): boolean {
    const expected = this.env.mcpToken;
    if (!expected) return false;
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private hash(token: string): string {
    return hashSessionToken(token, this.env.sessionSecret);
  }

  private page(res: Response, client: OAuthClientInformationFull, params: AuthorizationParams, error: string | null): void {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Content-Security-Policy",
      `default-src 'none'; style-src 'unsafe-inline'; form-action 'self' ${redirectSource(params.redirectUri)}; frame-ancestors 'none'`,
    );
    res.status(error ? 400 : 200).type("html").send(
      renderLoginPage({
        clientName: client.client_name?.trim() || "um app de IA",
        error,
        hidden: {
          client_id: client.client_id,
          redirect_uri: params.redirectUri,
          response_type: "code",
          code_challenge: params.codeChallenge,
          code_challenge_method: "S256",
          scope: params.scopes?.length ? params.scopes.join(" ") : undefined,
          state: params.state,
          resource: params.resource?.href,
        },
      }),
    );
  }
}
