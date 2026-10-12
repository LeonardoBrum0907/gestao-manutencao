import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { SettingsRepository } from "../competencia/infra/settings.repository";
import { ShowDashboard } from "./application/show-dashboard";
import { ShowOverview } from "./application/show-overview";
import { DashboardController } from "./http/dashboard.controller";
import { DashboardRead } from "./infra/dashboard-read.prisma";
import { OverviewRead } from "./infra/overview-read.prisma";

@Module({
  imports: [CadastroModule],
  controllers: [DashboardController],
  providers: [DashboardRead, ShowDashboard, OverviewRead, ShowOverview, SettingsRepository],
})
export class DashboardModule {}
