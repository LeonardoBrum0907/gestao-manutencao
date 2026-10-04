import { Injectable } from "@nestjs/common";
import type { SessionDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { EnvService } from "../../env.module";
import { hashSessionToken } from "../domain/session-token";
import { SessionCache } from "../infra/session.cache";
import { SessionRepository } from "../infra/session.repository";

@Injectable()
export class CurrentSession {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly cache: SessionCache,
    private readonly env: EnvService,
  ) {}

  async execute(token: string | null): Promise<SessionDto> {
    if (!token) throw new DomainError("unauthenticated", 401, "Entre para continuar.");
    const tokenHash = hashSessionToken(token, this.env.sessionSecret);
    const now = Date.now();
    const cached = this.cache.get(tokenHash, now);
    if (cached) return { email: cached };
    const active = await this.sessions.findActive(tokenHash, new Date(now));
    if (!active) throw new DomainError("unauthenticated", 401, "Entre para continuar.");
    this.cache.set(tokenHash, active.email, active.expiresAt, now);
    return { email: active.email };
  }
}
