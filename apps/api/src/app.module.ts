import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { CadastroModule } from "./cadastro/cadastro.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { EnvModule } from "./env.module";
import { HealthModule } from "./health/health.module";
import { DomainExceptionFilter } from "./http/domain-exception.filter";
import { IdentityModule } from "./identity/identity.module";
import { SessionGuard } from "./identity/http/session.guard";
import { PrismaModule } from "./prisma/prisma.module";
import { RegistroModule } from "./registro/registro.module";
import { TurnoModule } from "./turno/turno.module";

@Module({
  imports: [EnvModule, PrismaModule, HealthModule, IdentityModule, CadastroModule, RegistroModule, TurnoModule, DashboardModule],
  providers: [
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AppModule {}
