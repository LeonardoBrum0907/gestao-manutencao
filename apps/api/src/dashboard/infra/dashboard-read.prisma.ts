import { Injectable } from "@nestjs/common";
import { isRecordStatus, isRecordType, type RecordStatus, type RecordType } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";
import type { PanelRecord } from "../domain/panel";

@Injectable()
export class DashboardRead {
  constructor(private readonly prisma: PrismaService) {}

  async load(): Promise<{
    records: PanelRecord[];
    machines: { id: string; name: string }[];
    members: { id: string; name: string; status: string }[];
  }> {
    const [records, machines, members] = await Promise.all([
      this.prisma.record.findMany({
        select: {
          id: true,
          type: true,
          status: true,
          dueAt: true,
          body: true,
          occurredAt: true,
          createdAt: true,
          machineId: true,
          memberId: true,
        },
      }),
      this.prisma.machine.findMany({ select: { id: true, name: true } }),
      this.prisma.member.findMany({ select: { id: true, name: true, status: true } }),
    ]);
    return {
      records: records.map((row) => ({
        id: row.id,
        type: requireType(row.type),
        status: requireStatus(row.status),
        dueAt: row.dueAt,
        body: row.body,
        occurredAt: row.occurredAt,
        createdAt: row.createdAt,
        machineId: row.machineId,
        memberId: row.memberId,
      })),
      machines,
      members,
    };
  }
}

function requireType(value: string): RecordType {
  if (!isRecordType(value)) throw new DomainError("invalid", 500, "Registro gravado está inválido.");
  return value;
}

function requireStatus(value: string): RecordStatus {
  if (!isRecordStatus(value)) throw new DomainError("invalid", 500, "Registro gravado está inválido.");
  return value;
}
