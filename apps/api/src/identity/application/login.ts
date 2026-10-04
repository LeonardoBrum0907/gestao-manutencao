import { Injectable } from "@nestjs/common";
import type { SessionDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject, requiredString } from "../../kernel/parse";
import { EnvService } from "../../env.module";
import { GESTOR_EMAIL, SESSION_TTL_MS } from "../domain/gestor-account";
import { createSessionToken, hashSessionToken } from "../domain/session-token";
import { PasswordHasher } from "../infra/password.hasher";
import { SessionRepository } from "../infra/session.repository";
import { UserRepository } from "../infra/user.repository";

export type LoginResult = {
  session: SessionDto;
  token: string;
  maxAgeSec: number;
};

@Injectable()
export class Login {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly passwords: PasswordHasher,
    private readonly env: EnvService,
  ) {}

  async execute(body: unknown): Promise<LoginResult> {
    const source = readObject(body);
    const email = requiredString(source, "email", "Informe o e-mail.").toLowerCase();
    const password = requiredString(source, "password", "Informe a senha.");
    const user = await this.users.findByEmail(email);
    const valid = user ? await this.passwords.verify(user.passwordHash, password) : false;
    if (!user || !valid || user.email !== GESTOR_EMAIL) {
      throw new DomainError("invalid_credentials", 401, "E-mail ou senha não conferem.");
    }
    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.sessions.create(user.id, hashSessionToken(token, this.env.sessionSecret), expiresAt);
    // Sessões vencidas nunca eram apagadas; o login é o momento barato para limpar.
    void this.sessions.deleteExpired(new Date()).catch(() => undefined);
    return {
      session: { email: user.email },
      token,
      maxAgeSec: Math.floor(SESSION_TTL_MS / 1000),
    };
  }
}
