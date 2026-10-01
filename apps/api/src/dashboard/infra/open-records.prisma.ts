import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OPEN_RECORD_STATUS } from "../domain/open-count";

@Injectable()
export class OpenRecordsQuery {
  constructor(private readonly prisma: PrismaService) {}

  count(): Promise<number> {
    return this.prisma.record.count({ where: { status: OPEN_RECORD_STATUS } });
  }
}
