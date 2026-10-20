import { Module } from "@nestjs/common";
import { DATABASE_PROBE } from "./application/database-probe";
import { HealthController } from "./health.controller";
import { PrismaDatabaseProbe } from "./infra/prisma-database-probe";

@Module({
  controllers: [HealthController],
  providers: [{ provide: DATABASE_PROBE, useClass: PrismaDatabaseProbe }],
})
export class HealthModule {}
