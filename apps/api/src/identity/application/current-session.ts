import { Injectable } from "@nestjs/common";
import type { SessionDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { EnvService } from "../../env.module";
import { hashSessionToken } from "../domain/session-token";
import { SessionRepository } from "../infra/session.repository";

@Injectable()
export class CurrentSession {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly env: EnvService,
  ) {}

  async execute(token: string | null): Promise<SessionDto> {
    if (!token) throw new DomainError("unauthenticated", 401, "Entre para continuar.");
    const email = await this.sessions.findActiveEmail(
      hashSessionToken(token, this.env.sessionSecret),
      new Date(),
    );
    if (!email) throw new DomainError("unauthenticated", 401, "Entre para continuar.");
    return { email };
  }
}
