import { Injectable } from "@nestjs/common";
import type { PushDevice } from "@prisma/client";
import type { PushDeviceDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { PushDeviceStore, PushTarget } from "../application/push-ports";
import type { PushDeviceWrite } from "../domain/push-subscription";

function toDto(row: PushDevice): PushDeviceDto & PushTarget {
  return {
    id: row.id,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    label: row.label,
    createdAt: row.createdAt.toISOString(),
    lastSentAt: row.lastSentAt?.toISOString() ?? null,
  };
}

@Injectable()
export class PushDeviceRepository implements PushDeviceStore {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Array<PushDeviceDto & PushTarget>> {
    const rows = await this.prisma.pushDevice.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(toDto);
  }

  async upsert(write: PushDeviceWrite): Promise<PushDeviceDto> {
    const row = await this.prisma.pushDevice.upsert({ where: { endpoint: write.endpoint }, create: write, update: write });
    return toDto(row);
  }

  async remove(id: string): Promise<boolean> {
    const { count } = await this.prisma.pushDevice.deleteMany({ where: { id } });
    return count > 0;
  }

  async markSent(ids: string[], at: Date): Promise<void> {
    if (!ids.length) return;
    await this.prisma.pushDevice.updateMany({ where: { id: { in: ids } }, data: { lastSentAt: at } });
  }
}
