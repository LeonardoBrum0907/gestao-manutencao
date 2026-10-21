import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { Public } from "../http/public";
import { DATABASE_PROBE, type DatabaseProbe } from "./application/database-probe";

@Controller()
export class HealthController {
  constructor(@Inject(DATABASE_PROBE) private readonly database: DatabaseProbe) {}

  // Quem lê: o healthcheck do Docker, o deploy automático e o monitor de uptime do Sentry.
  // Com o banco fora do ar responde 503, para os três perceberem que a API não serve.
  @Public()
  @Get("health")
  async show(): Promise<{ status: "ok" }> {
    if (!(await this.database.isReachable())) {
      throw new ServiceUnavailableException("A API está no ar, mas o banco de dados não responde.");
    }
    return { status: "ok" };
  }
}
