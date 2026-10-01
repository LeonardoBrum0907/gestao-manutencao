import { Module } from "@nestjs/common";
import { OpenRecords } from "./application/open-records";
import { DashboardController } from "./http/dashboard.controller";
import { OpenRecordsQuery } from "./infra/open-records.prisma";

@Module({
  controllers: [DashboardController],
  providers: [OpenRecordsQuery, OpenRecords],
})
export class DashboardModule {}