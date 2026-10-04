import { Injectable } from "@nestjs/common";
import { EnvService } from "../../env.module";
import { hashSessionToken } from "../domain/session-token";
import { SessionCache } from "../infra/session.cache";
import { SessionRepository } from "../infra/session.repository";

@Injectable()
export class Logout {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly cache: SessionCache,
    private readonly env: EnvService,
  ) {}

  async execute(token: string | null): Promise<void> {
    if (!token) return;
    const tokenHash = hashSessionToken(token, this.env.sessionSecret);
    this.cache.delete(tokenHash);
    await this.sessions.deleteByHash(tokenHash);
  }
}
