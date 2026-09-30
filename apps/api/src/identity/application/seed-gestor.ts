import { Injectable, OnModuleInit } from "@nestjs/common";
import { GESTOR_EMAIL, GESTOR_PASSWORD } from "../domain/gestor-account";
import { PasswordHasher } from "../infra/password.hasher";
import { UserRepository } from "../infra/user.repository";

@Injectable()
export class SeedGestor implements OnModuleInit {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  async onModuleInit(): Promise<void> {
    const existing = await this.users.findByEmail(GESTOR_EMAIL);
    if (existing) return;
    const passwordHash = await this.passwords.hash(GESTOR_PASSWORD);
    await this.users.create(GESTOR_EMAIL, passwordHash);
  }
}
