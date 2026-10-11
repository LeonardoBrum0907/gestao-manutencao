import { Injectable, OnModuleInit } from "@nestjs/common";
import { EnvService } from "../../env.module";
import { GESTOR_EMAIL, GESTOR_PASSWORD } from "../domain/gestor-account";
import { PasswordHasher } from "../infra/password.hasher";
import { SessionRepository } from "../infra/session.repository";
import { UserRepository } from "../infra/user.repository";

@Injectable()
export class SeedGestor implements OnModuleInit {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly passwords: PasswordHasher,
    private readonly env: EnvService,
  ) {}

  async onModuleInit(): Promise<void> {
    const wanted = this.env.gestorPassword;
    const existing = await this.users.findByEmail(GESTOR_EMAIL);
    if (!existing) {
      await this.users.create(GESTOR_EMAIL, await this.passwords.hash(wanted ?? GESTOR_PASSWORD));
      return;
    }
    // GESTOR_PASSWORD no .env manda: se mudou, troca a senha e derruba as sessões abertas com a antiga.
    if (!wanted || (await this.passwords.verify(existing.passwordHash, wanted))) return;
    await this.users.updatePassword(existing.id, await this.passwords.hash(wanted));
    await this.sessions.deleteByUser(existing.id);
  }
}
