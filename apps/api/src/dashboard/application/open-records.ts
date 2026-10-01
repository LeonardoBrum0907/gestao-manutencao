import { Injectable } from "@nestjs/common";
import type { DashboardDto } from "@manutencao/shared";
import { OpenRecordsQuery } from "../infra/open-records.prisma";

@Injectable()
export class OpenRecords {
  constructor(private readonly query: OpenRecordsQuery) {}

  async execute(): Promise<DashboardDto> {
    return { openCount: await this.query.count() };
  }
}
