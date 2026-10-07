import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  isFeedbackTone,
  isRecordOrigin,
  isRecordPriority,
  isRecordStatus,
  isRecordType,
  type AttachmentDto,
  type MemberRecordSummaryDto,
  type RecordDto,
  type RecordListItemDto,
  type RecordPageDto,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";
import { dueRange } from "../domain/follow-up";
import type { RecordListFilter } from "../domain/record-list";
import type { RecordState } from "../domain/record-state";

const include = {
  attachments: { orderBy: { createdAt: "asc" as const } },
  members: { orderBy: { position: "asc" as const } },
};

type Row = {
  id: string;
  type: string;
  body: string;
  occurredAt: Date;
  status: string;
  memberId: string | null;
  factoryId: string | null;
  lineId: string | null;
  lineLabel: string | null;
  tag: string | null;
  line: string | null;
  priority: string | null;
  tone: string | null;
  dueAt: Date | null;
  notes: string | null;
  origin: string;
  dayNumber: number | null;
  openedAt: Date | null;
  closedAt: Date | null;
  durationMin: number | null;
  createdAt: Date;
  updatedAt: Date;
  members: { memberId: string; position: number }[];
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
  if (row.tone !== null && !isFeedbackTone(row.tone)) {
    throw new DomainError("invalid", 500, "Tom gravado está inválido.");
  }
  return {
    id: row.id,
    type: row.type,
    body: row.body,
    occurredAt: row.occurredAt.toISOString(),
    status: row.status,
    memberId: row.memberId,
    factoryId: row.factoryId,
    lineId: row.lineId,
    lineLabel: row.lineLabel,
    tag: row.tag,
    line: row.line,
    priority: row.priority,
    tone: row.tone,
    dueAt: row.dueAt ? row.dueAt.toISOString() : null,
    notes: row.notes,
    origin: row.origin,
    dayNumber: row.dayNumber,
    openedAt: row.openedAt ? row.openedAt.toISOString() : null,
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    durationMin: row.durationMin,
    memberIds: row.members.map((person) => person.memberId),
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

function scalars(state: RecordState) {
  return {
    type: state.type,
    body: state.body,
    occurredAt: state.occurredAt,
    status: state.status,
    memberId: state.memberId,
    factoryId: state.factoryId,
    lineId: state.lineId,
    lineLabel: state.lineLabel,
    tag: state.tag,
    line: state.line,
    priority: state.priority,
    tone: state.tone,
    dueAt: state.dueAt,
    notes: state.notes,
    origin: state.origin,
    dayNumber: state.dayNumber,
    openedAt: state.openedAt,
    closedAt: state.closedAt,
    durationMin: state.durationMin,
  };
}

const listSelect = {
  id: true,
  type: true,
  body: true,
  occurredAt: true,
  status: true,
  origin: true,
  priority: true,
  tone: true,
  dueAt: true,
  lineId: true,
} as const;

function toListItem(row: {
  id: string;
  type: string;
  body: string;
  occurredAt: Date;
  status: string;
  origin: string;
  priority: string | null;
  tone: string | null;
  dueAt: Date | null;
  lineId: string | null;
}): RecordListItemDto {
  if (!isRecordType(row.type) || !isRecordStatus(row.status) || !isRecordOrigin(row.origin)) {
    throw new DomainError("invalid", 500, "Registro gravado está inválido.");
  }
  if (row.priority !== null && !isRecordPriority(row.priority)) {
    throw new DomainError("invalid", 500, "Prioridade gravada está inválida.");
  }
  if (row.tone !== null && !isFeedbackTone(row.tone)) {
    throw new DomainError("invalid", 500, "Tom gravado está inválido.");
  }
  return {
    id: row.id,
    type: row.type,
    body: row.body,
    occurredAt: row.occurredAt.toISOString(),
    status: row.status,
    origin: row.origin,
    priority: row.priority,
    tone: row.tone,
    dueAt: row.dueAt ? row.dueAt.toISOString() : null,
    lineId: row.lineId,
  };
}

// O registro envolve a pessoa como responsável/alvo ou entre os técnicos do chamado.
function involving(memberId: string): Prisma.RecordWhereInput {
  return { OR: [{ memberId }, { members: { some: { memberId } } }] };
}

// Os filtros vão para o banco: antes a API trazia todos os registros e filtrava no Node.
function listWhere(filter: RecordListFilter, now: Date): Prisma.RecordWhereInput {
  const and: Prisma.RecordWhereInput[] = [];
  if (filter.types) and.push({ type: { in: filter.types } });
  if (filter.statuses) and.push({ status: { in: filter.statuses } });
  if (filter.lineIds) and.push({ lineId: { in: filter.lineIds } });
  if (filter.memberId) and.push(involving(filter.memberId));
  if (filter.due) {
    // Prazo é de tarefa ainda por fazer: concluída não vence nem vence hoje.
    and.push({ type: "task", status: { not: "done" }, dueAt: dueRange(filter.due, now) });
  }
  return { AND: and };
}

function memberRows(ids: string[]) {
  return ids.map((memberId, position) => ({ memberId, position }));
}

@Injectable()
export class RecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPage(filter: RecordListFilter, now: Date): Promise<RecordPageDto> {
    const rows = await this.prisma.record.findMany({
      where: listWhere(filter, now),
      select: listSelect,
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      take: filter.limit + 1,
      ...(filter.cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    });
    const items = rows.slice(0, filter.limit);
    return {
      items: items.map(toListItem),
      nextCursor: rows.length > filter.limit ? items[items.length - 1].id : null,
    };
  }

  // Os cinco números da ficha, contados no banco em vez de somar a lista inteira da pessoa.
  async memberSummary(memberId: string, now: Date): Promise<MemberRecordSummaryDto> {
    const mine = involving(memberId);
    const pending = { type: { not: "feedback" } } as const;
    const [open, overdue, done, chamados, feedbacks] = await Promise.all([
      this.prisma.record.count({ where: { AND: [mine, pending, { status: { not: "done" } }] } }),
      this.prisma.record.count({
        where: { AND: [mine, { type: "task", status: { not: "done" }, dueAt: dueRange("overdue", now) }] },
      }),
      this.prisma.record.count({ where: { AND: [mine, pending, { status: "done" }] } }),
      this.prisma.record.count({ where: { AND: [mine, { origin: "chamado" }] } }),
      this.prisma.record.count({ where: { AND: [mine, { type: "feedback" }] } }),
    ]);
    return { open, overdue, done, chamados, feedbacks };
  }

  async find(id: string): Promise<RecordDto | null> {
    const row = await this.prisma.record.findUnique({ where: { id }, include });
    return row ? toDto(row) : null;
  }

  async insert(state: RecordState): Promise<RecordDto> {
    const row = await this.prisma.record.create({
      data: { ...scalars(state), members: { create: memberRows(state.memberIds) } },
      include,
    });
    return toDto(row);
  }

  // Com os mesmos técnicos de antes, só o registro muda: um UPDATE, sem transação para refazer os vínculos.
  async update(id: string, state: RecordState, previousMemberIds: string[]): Promise<RecordDto> {
    const sameMembers =
      previousMemberIds.length === state.memberIds.length && previousMemberIds.every((memberId, index) => memberId === state.memberIds[index]);
    const row = await this.prisma.record.update({
      where: { id },
      data: {
        ...scalars(state),
        ...(sameMembers ? {} : { members: { deleteMany: {}, create: memberRows(state.memberIds) } }),
      },
      include,
    });
    return toDto(row);
  }

  // Apaga o registro e devolve as chaves dos anexos, para quem chamou limpar os arquivos do disco.
  async remove(id: string): Promise<string[]> {
    const files = await this.prisma.recordAttachment.findMany({ where: { recordId: id }, select: { storageKey: true } });
    await this.prisma.record.delete({ where: { id } });
    return files.map((file) => file.storageKey);
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
