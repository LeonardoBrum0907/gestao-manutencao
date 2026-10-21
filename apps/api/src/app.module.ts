import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { CadastroModule } from "./cadastro/cadastro.module";
import { AvaliacaoModule } from "./avaliacao/avaliacao.module";
import { AvisoModule } from "./aviso/aviso.module";
import { CompetenciaModule } from "./competencia/competencia.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DocumentacaoModule } from "./documentacao/documentacao.module";
import { LembreteModule } from "./lembrete/lembrete.module";
import { EnvModule } from "./env.module";
import { HealthModule } from "./health/health.module";
import { DomainExceptionFilter } from "./http/domain-exception.filter";
import { IdentityModule } from "./identity/identity.module";
import { SessionGuard } from "./identity/http/session.guard";
import { McpModule } from "./mcp/mcp.module";
import { ObservabilidadeModule } from "./observabilidade/observabilidade.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RegistroModule } from "./registro/registro.module";
import { PosPreventivaModule } from "./pos-preventiva/pos-preventiva.module";
import { RpModule } from "./rp/rp.module";
import { RpPublicoModule } from "./rp-publico/rp-publico.module";
import { TurnoModule } from "./turno/turno.module";

@Module({
  imports: [EnvModule, ObservabilidadeModule, PrismaModule, HealthModule, IdentityModule, CadastroModule, CompetenciaModule, AvaliacaoModule, RegistroModule, TurnoModule, RpModule, RpPublicoModule, PosPreventivaModule, DashboardModule, DocumentacaoModule, McpModule, AvisoModule, LembreteModule],
  providers: [
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AppModule {}
