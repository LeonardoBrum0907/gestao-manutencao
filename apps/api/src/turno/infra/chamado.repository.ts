import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { isChamadoShift, isRecordStatus, isRpStatus, type ChamadoDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";
import { calendarDay, nextCalendarDay, startOfDay } from "../../registro/domain/follow-up";
import type { ChamadoListFilter } from "../application/parse-shift";
import { nextDayNumber, type ChamadoTaskInput, type ChamadoWrite } from "../domain/shift";

const select = {
  id: true,
  dayNumber: true,
  shift: true,
  occurredAt: true,
  openedAt: true,
  closedAt: true,
  durationMin: true,
  body: true,
  notes: true,
  status: true,
  lineId: true,
  lineLabel: true,
  machineId: true,
  members: { orderBy: { position: "asc" as const }, select: { memberId: true } },
  tasks: {
    orderBy: { createdAt: "asc" as const },
    select: { id: true, body: true, status: true, dueAt: true, memberId: true },
  },
  rpOfChamado: { select: { id: true, status: true } },
} satisfies Prisma.RecordSelect;

type Row = Prisma.RecordGetPayload<{ select: typeof select }>;

function status(value: string) {
  if (!isRecordStatus(value)) throw new DomainError("invalid", 500, "Status gravado está inválido.");
  return value;
}

function toDto(row: Row): ChamadoDto {
  const rp = row.rpOfChamado;
  return {
    id: row.id,
    dayNumber: row.dayNumber,
    day: calendarDay(row.occurredAt),
    shift: row.shift && isChamadoShift(row.shift) ? row.shift : null,
    occurredAt: row.occurredAt.toISOString(),
    openedAt: row.openedAt ? row.openedAt.toISOString() : null,
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
    durationMin: row.durationMin,
    body: row.body,
    notes: row.notes,
    status: status(row.status),
    lineId: row.lineId,
    lineLabel: row.lineLabel,
    machineId: row.machineId,
    memberIds: row.members.map((link) => link.memberId),
    tasks: row.tasks.map((task) => ({
      id: task.id,
      body: task.body,
      status: status(task.status),
      dueAt: task.dueAt ? task.dueAt.toISOString() : null,
      memberId: task.memberId,
    })),
    rp: rp && isRpStatus(rp.status) ? { id: rp.id, status: rp.status } : null,
  };
}

function dayRange(day: string): { gte: Date; lt: Date } {
  return { gte: startOfDay(day), lt: startOfDay(nextCalendarDay(day)) };
}

function scalars(write: ChamadoWrite) {
  return {
    body: write.body,
    occurredAt: write.occurredAt,
    openedAt: write.openedAt,
    closedAt: write.closedAt,
    durationMin: write.durationMin,
    shift: write.shift,
    lineId: write.lineId,
    lineLabel: write.lineLabel,
    machineId: write.machineId,
    status: write.status,
    notes: write.notes,
  };
}

function memberRows(ids: string[]) {
  return ids.map((memberId, position) => ({ memberId, position }));
}

const chamado = { type: "problem", origin: "chamado" } as const;

@Injectable()
export class ChamadoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: ChamadoListFilter): Promise<ChamadoDto[]> {
    const and: Prisma.RecordWhereInput[] = [chamado];
    if (filter.day) and.push({ occurredAt: dayRange(filter.day) });
    if (filter.lineId) and.push({ lineId: filter.lineId });
    const rows = await this.prisma.record.findMany({
      where: { AND: and },
      select,
      // O dia lê na ordem do turno; a linha mostra os mais recentes primeiro.
      orderBy: filter.day ? [{ occurredAt: "asc" }, { id: "asc" }] : [{ occurredAt: "desc" }, { id: "desc" }],
      take: filter.limit,
    });
    return rows.map(toDto);
  }

  async find(id: string): Promise<ChamadoDto | null> {
    const row = await this.prisma.record.findFirst({ where: { id, ...chamado }, select });
    return row ? toDto(row) : null;
  }

  // Linha a que a máquina pertence, para conferir a escolha do chamado.
  async machineLine(machineId: string): Promise<string | null> {
    const row = await this.prisma.machine.findUnique({ where: { id: machineId }, select: { lineId: true } });
    return row?.lineId ?? null;
  }

  private async dayNumberFor(at: Date, exceptId?: string): Promise<number> {
    const rows = await this.prisma.record.findMany({
      where: { ...chamado, occurredAt: dayRange(calendarDay(at)), ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { dayNumber: true },
    });
    return nextDayNumber(rows.map((row) => row.dayNumber));
  }

  async insert(write: ChamadoWrite): Promise<ChamadoDto> {
    const dayNumber = await this.dayNumberFor(write.occurredAt);
    const row = await this.prisma.record.create({
      data: { ...chamado, ...scalars(write), dayNumber, members: { create: memberRows(write.memberIds) } },
      select,
    });
    return toDto(row);
  }

  // Mudou o dia da abertura: o chamado ganha o próximo número do novo dia.
  async update(current: ChamadoDto, write: ChamadoWrite): Promise<ChamadoDto> {
    const sameDay = current.day === calendarDay(write.occurredAt);
    const dayNumber = sameDay && current.dayNumber !== null ? current.dayNumber : await this.dayNumberFor(write.occurredAt, current.id);
    const sameMembers =
      current.memberIds.length === write.memberIds.length && current.memberIds.every((memberId, index) => memberId === write.memberIds[index]);
    const row = await this.prisma.record.update({
      where: { id: current.id },
      data: {
        ...scalars(write),
        dayNumber,
        ...(sameMembers ? {} : { members: { deleteMany: {}, create: memberRows(write.memberIds) } }),
      },
      select,
    });
    return toDto(row);
  }

  // "Gerar pendência": uma Tarefa comum, ligada ao chamado, com a linha escrita como na ficha da tarefa.
  async addTask(current: ChamadoDto, input: ChamadoTaskInput, now: Date): Promise<ChamadoDto> {
    const line = current.lineId
      ? await this.prisma.line.findUnique({ where: { id: current.lineId }, select: { name: true, factoryId: true } })
      : null;
    await this.prisma.record.create({
      data: {
        type: "task",
        origin: "inbox",
        body: input.body,
        occurredAt: now,
        status: "open",
        memberId: input.memberId,
        priority: input.priority,
        dueAt: input.dueAt,
        factoryId: line?.factoryId ?? null,
        line: line?.name ?? current.lineLabel,
        chamadoId: current.id,
      },
    });
    const row = await this.prisma.record.findUniqueOrThrow({ where: { id: current.id }, select });
    return toDto(row);
  }
}
