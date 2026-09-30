import { Injectable } from "@nestjs/common";
import {
  isRecordOrigin,
  isRecordPriority,
  isRecordStatus,
  isRecordType,
  type AttachmentDto,
  type RecordDto,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";
import type { RecordState } from "../domain/record-state";

const include = { attachments: { orderBy: { createdAt: "asc" as const } } };

type Row = {
  id: string;
  type: string;
  body: string;
  occurredAt: Date;
  status: string;
  technicianId: string | null;
  factoryId: string | null;
  machineId: string | null;
  machineLabel: string | null;
  tag: string | null;
  line: string | null;
  priority: string | null;
  dueAt: Date | null;
  notes: string | null;
  origin: string;
  createdAt: Date;
  updatedAt: Date;
  attachments: {
    id: string;
    fileName: string;
    mimeType: string;
    createdAt: Date;
  }[];
};

function toDto(row: Row): RecordDto {
  if (!isRecordType(row.type) || !isRecordStatus(row.status) || !isRecordOrigin(row.origin)) {
    throw new DomainError("invalid", 500, "Registro gravado está inválido.");
  }
  if (row.priority !== null && !isRecordPriority(row.priority)) {
    throw new DomainError("invalid", 500, "Prioridade gravada está inválida.");
  }
  return {
    id: row.id,
    type: row.type,
    body: row.body,
    occurredAt: row.occurredAt.toISOString(),
    status: row.status,
    technicianId: row.technicianId,
    factoryId: row.factoryId,
    machineId: row.machineId,
    machineLabel: row.machineLabel,
    tag: row.tag,
    line: row.line,
    priority: row.priority,
    dueAt: row.dueAt ? row.dueAt.toISOString() : null,
    notes: row.notes,
    origin: row.origin,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    attachments: row.attachments.map(
      (item): AttachmentDto => ({
        id: item.id,
        fileName: item.fileName,
        mimeType: item.mimeType,
        createdAt: item.createdAt.toISOString(),
      }),
    ),
  };
}

function toData(state: RecordState) {
  return {
    type: state.type,
    body: state.body,
    occurredAt: state.occurredAt,
    status: state.status,
    technicianId: state.technicianId,
    factoryId: state.factoryId,
    machineId: state.machineId,
    machineLabel: state.machineLabel,
    tag: state.tag,
    line: state.line,
    priority: state.priority,
    dueAt: state.dueAt,
    notes: state.notes,
    origin: state.origin,
  };
}

@Injectable()
export class RecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<RecordDto[]> {
    const rows = await this.prisma.record.findMany({
      include,
      orderBy: { occurredAt: "desc" },
    });
    return rows.map(toDto);
  }

  async find(id: string): Promise<RecordDto | null> {
    const row = await this.prisma.record.findUnique({ where: { id }, include });
    return row ? toDto(row) : null;
  }

  async insert(state: RecordState): Promise<RecordDto> {
    const row = await this.prisma.record.create({ data: toData(state), include });
    return toDto(row);
  }

  async update(id: string, state: RecordState): Promise<RecordDto> {
    const row = await this.prisma.record.update({ where: { id }, data: toData(state), include });
    return toDto(row);
  }

  async addAttachment(
    recordId: string,
    file: { fileName: string; mimeType: string; storageKey: string },
  ): Promise<AttachmentDto> {
    const row = await this.prisma.recordAttachment.create({
      data: { recordId, ...file },
    });
    return {
      id: row.id,
      fileName: row.fileName,
      mimeType: row.mimeType,
      createdAt: row.createdAt.toISOString(),
    };
  }

  findAttachment(recordId: string, attachmentId: string) {
    return this.prisma.recordAttachment.findFirst({ where: { id: attachmentId, recordId } });
  }

  async removeAttachment(recordId: string, attachmentId: string): Promise<void> {
    await this.prisma.recordAttachment.deleteMany({ where: { id: attachmentId, recordId } });
  }
}
