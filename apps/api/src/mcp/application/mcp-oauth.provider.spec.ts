import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Response } from "express";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { EnvService } from "../../env.module";
import type { PasswordHasher } from "../../identity/infra/password.hasher";
import type { UserRepository } from "../../identity/infra/user.repository";
import type { McpOAuthRepository, StoredMcpToken } from "../infra/mcp-oauth.repository";
import { McpOAuthProvider, STATIC_TOKEN_CLIENT } from "./mcp-oauth.provider";

const client = { client_id: "c1", redirect_uris: ["https://claude.ai/cb"], client_name: "Claude" } as OAuthClientInformationFull;
const params = { codeChallenge: "ch", redirectUri: "https://claude.ai/cb", state: "s", scopes: [] };

function setup(storedPassword: string, mcpToken: string | null = null) {
  const tokens = new Map<string, StoredMcpToken>();
  const repository = {
    saveToken: async (hash: string, token: StoredMcpToken) => void tokens.set(hash, token),
    findToken: async (hash: string) => tokens.get(hash) ?? null,
    takeToken: async (hash: string) => tokens.delete(hash),
    deleteExpired: async () => undefined,
  } as unknown as McpOAuthRepository;
  const users = { findByEmail: async () => ({ id: "u", email: "gestor@local", passwordHash: storedPassword }) } as unknown as UserRepository;
  const passwords = { verify: async (hash: string, plain: string) => hash === plain } as unknown as PasswordHasher;
  const env = { sessionSecret: "s", mcpToken } as EnvService;
  return new McpOAuthProvider(repository, users, passwords, env);
}

function fakeResponse(body: Record<string, string>) {
  const out: { status?: number; html?: string; location?: string } = {};
  const res = {
    req: { method: "POST", body },
    setHeader: () => res,
    status: (code: number) => ((out.status = code), res),
    type: () => res,
    send: (html: string) => ((out.html = html), res),
    redirect: (code: number, location: string) => ((out.status = code), (out.location = location), res),
  };
  return { res: res as unknown as Response, out };
}

describe("login OAuth do MCP", () => {
  it("recusa a senha padrão do código mesmo quando ela confere", async () => {
    const provider = setup("gestor");
    const { res, out } = fakeResponse({ decision: "allow", password: "gestor" });
    await provider.authorize(client, params, res);
    assert.equal(out.status, 400);
    assert.match(out.html ?? "", /GESTOR_PASSWORD/);
  });

  it("com a senha nova devolve o código e troca por chaves que valem no /mcp", async () => {
    const provider = setup("senha-nova-123");
    const { res, out } = fakeResponse({ decision: "allow", password: "senha-nova-123" });
    await provider.authorize(client, params, res);
    const location = new URL(out.location ?? "");
    assert.equal(location.searchParams.get("state"), "s");
    const code = location.searchParams.get("code") ?? "";
    assert.equal(await provider.challengeForAuthorizationCode(client, code), "ch");
    const tokens = await provider.exchangeAuthorizationCode(client, code, undefined, "https://claude.ai/cb");
    const info = await provider.verifyAccessToken(tokens.access_token);
    assert.equal(info.clientId, "c1");
    await assert.rejects(provider.verifyAccessToken(tokens.refresh_token ?? ""));
  });

  it("aceita a chave fixa do .env só quando ela existe", async () => {
    const fixed = "x".repeat(40);
    assert.equal((await setup("a", fixed).verifyAccessToken(fixed)).clientId, STATIC_TOKEN_CLIENT);
    await assert.rejects(setup("a", null).verifyAccessToken(fixed));
    await assert.rejects(setup("a", fixed).verifyAccessToken(fixed.slice(1)));
  });
});
