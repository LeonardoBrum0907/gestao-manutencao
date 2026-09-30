import { Injectable } from "@nestjs/common";
import { EnvService } from "../../env.module";
import { hashSessionToken } from "../domain/session-token";
import { SessionRepository } from "../infra/session.repository";

@Injectable()
export class Logout {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly env: EnvService,
  ) {}

  async execute(token: string | null): Promise<void> {
    if (!token) return;
    await this.sessions.deleteByHash(hashSessionToken(token, this.env.sessionSecret));
  }
}
