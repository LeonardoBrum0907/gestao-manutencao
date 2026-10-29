import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { isRecordPriority, isRecordStatus, isRecordType, isReminderKind, readTaskRepeat, type ReminderRule, type TaskRepeat } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { reminderWrite } from "../../lembrete/domain/reminder-input";
import { PrismaService } from "../../prisma/prisma.service";
import type { RepeatCandidate, TaskRepeatStore } from "../application/task-repeat-ports";
import type { NextTask, RepeatSource } from "../domain/task-repeat-next";

const candidateSelect = {
  type: true,
  status: true,
  body: true,
  memberId: true,
  factoryId: true,
  tag: true,
  line: true,
  priority: true,
  notes: true,
  dueAt: true,
  dueHasTime: true,
  repeat: true,
  repeatNext: { select: { id: true } },
  members: { orderBy: { position: "asc" as const }, select: { memberId: true } },
  reminders: { orderBy: { createdAt: "asc" as const }, select: { kind: true, at: true, minutesBefore: true } },
} satisfies Prisma.RecordSelect;

type CandidateRow = Prisma.RecordGetPayload<{ select: typeof candidateSelect }>;

function reminderRules(rows: CandidateRow["reminders"]): ReminderRule[] {
  return rows.flatMap((row) => (isReminderKind(row.kind) ? [{ kind: row.kind, at: row.at?.toISOString() ?? null, minutesBefore: row.minutesBefore }] : []));
}

function repeatSource(row: CandidateRow, repeat: TaskRepeat): RepeatSource {
  const priority = row.priority !== null && isRecordPriority(row.priority) ? row.priority : null;
  return {
    body: row.body,
    memberId: row.memberId,
    memberIds: row.members.map((member) => member.memberId),
    factoryId: row.factoryId,
    tag: row.tag,
    line: row.line,
    priority,
    notes: row.notes,
    dueAt: row.dueAt,
    dueHasTime: row.dueHasTime,
    repeat,
    reminders: reminderRules(row.reminders),
  };
}

function isUniqueClash(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** Leitura e gravação da série de tarefas que se repetem. */
@Injectable()
export class TaskRepeatRepository implements TaskRepeatStore {
  constructor(private readonly prisma: PrismaService) {}

  async candidate(id: string): Promise<RepeatCandidate | null> {
    const row = await this.prisma.record.findUnique({ where: { id }, select: candidateSelect });
    if (!row) return null;
    if (!isRecordType(row.type) || !isRecordStatus(row.status)) {
      throw new DomainError("invalid", 500, `Registro gravado está inválido: tipo ${row.type}, situação ${row.status}.`);
    }
    const repeat = readTaskRepeat(row.repeat);
    return { type: row.type, status: row.status, hasNext: row.repeatNext !== null, source: repeat ? repeatSource(row, repeat) : null };
  }

  // repeatOfId é único: duas conclusões ao mesmo tempo gravam só uma próxima; a outra cai aqui e vira nulo.
  async insertNext(previousId: string, next: NextTask, repeat: TaskRepeat): Promise<string | null> {
    const { memberIds, ...state } = next.state;
    try {
      const row = await this.prisma.record.create({
        data: {
          ...state,
          repeat: repeat as Prisma.InputJsonValue,
          repeatOfId: previousId,
          members: { create: memberIds.map((memberId, position) => ({ memberId, position })) },
          reminders: { create: next.reminders.map(reminderWrite) },
        },
        select: { id: true },
      });
      return row.id;
    } catch (error) {
      if (isUniqueClash(error)) return null;
      throw error;
    }
  }

  // Em andamento ou com anexo, alguém já mexeu nela: fica.
  async removeOpenNext(previousId: string): Promise<boolean> {
    const removed = await this.prisma.record.deleteMany({ where: { repeatOfId: previousId, status: "open", attachments: { none: {} } } });
    return removed.count > 0;
  }
}
