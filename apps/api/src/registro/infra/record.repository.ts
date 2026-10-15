import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  isFeedbackTone,
  isRecordOrigin,
  isRecordPriority,
  isRecordStatus,
  isRecordType,
  type AttachmentDto,
  type BoardDto,
  type BoardGroup,
  type BoardItemDto,
  type FeedbackBoardDto,
  type ProblemBoardDto,
  type MemberRecordSummaryDto,
  type RecordDto,
  type RecordListItemDto,
  type RecordPageDto,
  type RecordStatus,
  type TaskReminderBody,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";
import { boardGroup, compareBoard, doneSince, FEEDBACK_DONE_WINDOW_DAYS } from "../domain/board";
import { calendarDay, dueRange } from "../domain/follow-up";
import type { RecordListFilter } from "../domain/record-list";
import type { RecordLinks } from "../domain/record-removal";
import type { RecordState } from "../domain/record-state";
import { reminderWrite } from "../../lembrete/domain/reminder-input";
import { completionStep } from "./record-completion";

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
  dueHasTime: boolean;
  notes: string | null;
  origin: string;
  dayNumber: number | null;
  openedAt: Date | null;
  closedAt: Date | null;
  durationMin: number | null;
  machineId: string | null;
  subassemblyId: string | null;
  chamadoId: string | null;
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
    dueHasTime: row.dueHasTime,
    notes: row.notes,
    origin: row.origin,
    dayNumber: row.dayNumber,
    openedAt: row.openedAt ? row.openedAt.toISOString() : null,
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    durationMin: row.durationMin,
    memberIds: row.members.map((person) => person.memberId),
    machineId: row.machineId,
    subassemblyId: row.subassemblyId,
    chamadoId: row.chamadoId,
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
    dueHasTime: state.dueHasTime,
    notes: state.notes,
    origin: state.origin,
    dayNumber: state.dayNumber,
    openedAt: state.openedAt,
    closedAt: state.closedAt,
    durationMin: state.durationMin,
    machineId: state.machineId,
    subassemblyId: state.subassemblyId,
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
  dueHasTime: true,
  lineId: true,
  machineId: true,
  subassemblyId: true,
  memberId: true,
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
  dueHasTime: boolean;
  lineId: string | null;
  machineId: string | null;
  subassemblyId: string | null;
  memberId: string | null;
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
    dueHasTime: row.dueHasTime,
    lineId: row.lineId,
    machineId: row.machineId,
    subassemblyId: row.subassemblyId,
    memberId: row.memberId,
  };
}

// O registro envolve a pessoa como responsável/alvo ou entre os técnicos do chamado.
function involving(memberId: string): Prisma.RecordWhereInput {
  return { OR: [{ memberId }, { members: { some: { memberId } } }] };
}

// Os filtros vão para o banco: antes a API trazia todos os registros e filtrava no Node.
// Chamado tem tela própria (Turno › Chamados) e fica fora de Registros; o que sobra dele vira Tarefa.
export const notChamado = { origin: { not: "chamado" } } as const;

function listWhere(filter: RecordListFilter, now: Date): Prisma.RecordWhereInput {
  const and: Prisma.RecordWhereInput[] = [notChamado];
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

const boardSelect = {
  id: true,
  type: true,
  body: true,
  occurredAt: true,
  status: true,
  origin: true,
  priority: true,
  dueAt: true,
  dueHasTime: true,
  boardPosition: true,
  updatedAt: true,
  completedAt: true,
} as const;

function openOrDoneSince(since: Date): Prisma.RecordWhereInput {
  return { OR: [{ status: { in: ["open", "in_progress"] } }, { status: "done", updatedAt: { gte: since } }] };
}

// Abertos primeiro, na ordem do checklist; concluídos depois, o último fechado no topo.
function sortChecklist<T extends { id: string; status: string; boardPosition: number | null; dueAt: Date | null; occurredAt: Date; updatedAt: Date }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aDone = a.status === "done";
    const bDone = b.status === "done";
    if (aDone !== bDone) return aDone ? 1 : -1;
    if (aDone) return b.updatedAt.getTime() - a.updatedAt.getTime();
    return compareBoard(a, b);
  });
}

const boardOrder: Record<BoardGroup, number> = { overdue: 0, today: 1, upcoming: 2, undated: 3, done: 4 };

export type BoardWrite = {
  status: RecordStatus | null;
  // undefined = prazo não muda; null = sem prazo.
  dueAt: Date | null | undefined;
  dueHasTime: boolean;
  order: string[] | null;
};

@Injectable()
export class RecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Checklist de Tarefas: as em aberto, mais as concluídas da última semana.
  async taskBoard(now: Date): Promise<BoardDto> {
    const rows = await this.prisma.record.findMany({
      where: {
        AND: [
          notChamado,
          { type: "task" },
          openOrDoneSince(doneSince(now)),
        ],
      },
      select: boardSelect,
    });
    const placed = rows.map((row) => ({ row, group: boardGroup({ status: row.status as BoardItemDto["status"], dueAt: row.dueAt }, now) }));
    placed.sort((a, b) => {
      if (a.group !== b.group) return boardOrder[a.group] - boardOrder[b.group];
      // Concluídas: a última fechada no topo.
      if (a.group === "done") return b.row.updatedAt.getTime() - a.row.updatedAt.getTime();
      return compareBoard(a.row, b.row);
    });
    return {
      today: calendarDay(now),
      items: placed.map(({ row, group }) => {
        const item = toListItem({ ...row, tone: null, lineId: null, machineId: null, subassemblyId: null, memberId: null });
        return {
          id: item.id,
          type: item.type,
          body: item.body,
          status: item.status,
          origin: item.origin,
          priority: item.priority,
          dueAt: item.dueAt,
          dueHasTime: item.dueHasTime,
          occurredAt: item.occurredAt,
          group,
          completedAt: row.completedAt ? row.completedAt.toISOString() : null,
        };
      }),
    };
  }

  // Problemas em aberto e os resolvidos da semana; a tela agrupa por linha ou situação.
  async problemBoard(now: Date): Promise<ProblemBoardDto> {
    const rows = await this.prisma.record.findMany({
      where: { AND: [notChamado, { type: "problem" }, openOrDoneSince(doneSince(now))] },
      select: {
        id: true,
        body: true,
        status: true,
        origin: true,
        occurredAt: true,
        dueAt: true,
        boardPosition: true,
        updatedAt: true,
        lineId: true,
        lineLabel: true,
        line: true,
        machineId: true,
        machine: { select: { name: true } },
        subassemblyId: true,
        subassembly: { select: { name: true } },
        rp: { select: { id: true } },
      },
    });
    const lineIds = [...new Set(rows.map((row) => row.lineId).filter((id): id is string => Boolean(id)))];
    const lines = lineIds.length
      ? await this.prisma.line.findMany({ where: { id: { in: lineIds } }, select: { id: true, name: true } })
      : [];
    const lineNames = new Map(lines.map((line) => [line.id, line.name]));
    return {
      items: sortChecklist(rows).map((row) => {
        if (!isRecordStatus(row.status) || !isRecordOrigin(row.origin)) {
          throw new DomainError("invalid", 500, "Registro gravado está inválido.");
        }
        return {
          id: row.id,
          body: row.body,
          status: row.status,
          origin: row.origin,
          occurredAt: row.occurredAt.toISOString(),
          lineId: row.lineId,
          lineName: (row.lineId ? lineNames.get(row.lineId) : null) ?? row.lineLabel ?? row.line ?? null,
          machineId: row.machineId,
          machineName: row.machine?.name ?? null,
          subassemblyId: row.subassemblyId,
          subassemblyName: row.subassembly?.name ?? null,
          rpId: row.rp?.id ?? null,
        };
      }),
    };
  }

  // Feedbacks a conversar e os conversados do último mês; a tela agrupa por colaborador, tom ou data.
  async feedbackBoard(now: Date): Promise<FeedbackBoardDto> {
    const rows = await this.prisma.record.findMany({
      where: { AND: [{ type: "feedback" }, openOrDoneSince(doneSince(now, FEEDBACK_DONE_WINDOW_DAYS))] },
      select: {
        id: true,
        body: true,
        status: true,
        occurredAt: true,
        dueAt: true,
        boardPosition: true,
        updatedAt: true,
        tone: true,
        memberId: true,
        member: { select: { name: true } },
      },
    });
    return {
      items: sortChecklist(rows).map((row) => {
        if (!isRecordStatus(row.status) || (row.tone !== null && !isFeedbackTone(row.tone))) {
          throw new DomainError("invalid", 500, "Registro gravado está inválido.");
        }
        return {
          id: row.id,
          body: row.body,
          status: row.status,
          occurredAt: row.occurredAt.toISOString(),
          tone: row.tone,
          memberId: row.memberId,
          memberName: row.member?.name ?? null,
        };
      }),
    };
  }

  async boardRecord(id: string) {
    const row = await this.prisma.record.findUnique({ where: { id }, select: { type: true, origin: true, dueAt: true, dueHasTime: true } });
    if (!row) return null;
    if (!isRecordType(row.type) || !isRecordOrigin(row.origin)) {
      throw new DomainError("invalid", 500, "Registro gravado está inválido.");
    }
    return { type: row.type, origin: row.origin, dueAt: row.dueAt, dueHasTime: row.dueHasTime };
  }

  // Uma transação: o item muda de status/prazo e o grupo de destino recebe a ordem nova (0, 1, 2…).
  async applyBoard(id: string, write: BoardWrite): Promise<void> {
    const data: Prisma.RecordUpdateInput = {};
    if (write.status !== null) data.status = write.status;
    if (write.dueAt !== undefined) {
      data.dueAt = write.dueAt;
      data.dueHasTime = write.dueAt !== null && write.dueHasTime;
    }
    const steps: Prisma.PrismaPromise<unknown>[] = [];
    if (Object.keys(data).length > 0) steps.push(this.prisma.record.update({ where: { id }, data }));
    if (write.status !== null) steps.push(completionStep(this.prisma, id, write.status, new Date()));
    (write.order ?? []).forEach((recordId, index) => {
      steps.push(this.prisma.record.updateMany({ where: { id: recordId }, data: { boardPosition: index } }));
    });
    await this.prisma.$transaction(steps);
  }

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
    const pending = { type: { not: "feedback" }, ...notChamado } as const;
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
    const completedAt = state.status === "done" ? new Date() : null;
    const row = await this.prisma.record.create({
      data: { ...scalars(state), completedAt, members: { create: memberRows(state.memberIds) } },
      include,
    });
    return toDto(row);
  }

  // Com os mesmos técnicos de antes, só o registro muda: um UPDATE, sem transação para refazer os vínculos.
  // Registro que trocou de tipo vai para outra lista do checklist: a posição da lista antiga não vale lá.
  async reminderCount(id: string): Promise<number> {
    return this.prisma.taskReminder.count({ where: { recordId: id } });
  }

  async update(
    id: string,
    state: RecordState,
    previousMemberIds: string[],
    options: { retyped?: boolean; reminders?: TaskReminderBody[] } = {},
  ): Promise<RecordDto> {
    const sameMembers =
      previousMemberIds.length === state.memberIds.length && previousMemberIds.every((memberId, index) => memberId === state.memberIds[index]);
    const [row] = await this.prisma.$transaction([
      this.prisma.record.update({
        where: { id },
        data: {
          ...scalars(state),
          ...(options.retyped ? { boardPosition: null } : {}),
          ...(sameMembers ? {} : { members: { deleteMany: {}, create: memberRows(state.memberIds) } }),
          ...(options.reminders?.length ? { reminders: { create: options.reminders.map(reminderWrite) } } : {}),
        },
        include,
      }),
      completionStep(this.prisma, id, state.status, new Date()),
    ]);
    return toDto(row);
  }

  async links(id: string): Promise<RecordLinks | null> {
    const row = await this.prisma.record.findUnique({
      where: { id },
      select: {
        member: { select: { name: true } },
        members: { orderBy: { position: "asc" }, select: { member: { select: { name: true } } } },
        rp: { select: { orderNumber: true, _count: { select: { postPreventives: true } } } },
        rpOfChamado: { select: { id: true } },
        _count: { select: { attachments: true, tasks: true } },
      },
    });
    if (!row) return null;
    const memberNames = [row.member?.name, ...row.members.map((link) => link.member.name)].filter((name): name is string => Boolean(name));
    return {
      rp: row.rp ? { orderNumber: row.rp.orderNumber, postPreventives: row.rp._count.postPreventives } : null,
      attachments: row._count.attachments,
      chamadoTasks: row._count.tasks,
      chamadoRp: Boolean(row.rpOfChamado),
      memberNames: [...new Set(memberNames)],
    };
  }

  // Excluir pela lista de Registros: o RP de quem o registro é espelho sai junto (sem o espelho o RP
  // some das listas). Pós-preventivas ligadas ao RP só perdem a ligação (SetNull no banco).
  async removeWithRp(id: string): Promise<string[]> {
    const files = await this.prisma.recordAttachment.findMany({ where: { recordId: id }, select: { storageKey: true } });
    await this.prisma.$transaction([
      this.prisma.rp.deleteMany({ where: { problemRecordId: id } }),
      this.prisma.record.delete({ where: { id } }),
    ]);
    return files.map((file) => file.storageKey);
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
