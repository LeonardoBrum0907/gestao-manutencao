import { Module } from "@nestjs/common";
import { ShowDashboard } from "./application/show-dashboard";
import { DashboardController } from "./http/dashboard.controller";
import { DashboardRead } from "./infra/dashboard-read.prisma";

@Module({
  controllers: [DashboardController],
  providers: [DashboardRead, ShowDashboard],
})
export class DashboardModule {}
