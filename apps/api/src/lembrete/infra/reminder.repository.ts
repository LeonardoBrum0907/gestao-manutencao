import { Injectable } from "@nestjs/common";
import type { TaskReminder } from "@prisma/client";
import { isReminderKind, type ReminderKind, type TaskReminderDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";
import type { ReminderStore } from "../application/reminder-ports";
import type { ReminderWrite } from "../domain/reminder-input";
import type { ReminderCandidate } from "../domain/reminder-schedule";

function kindOf(row: TaskReminder): ReminderKind {
  if (isReminderKind(row.kind)) return row.kind;
  throw new DomainError("invalid", 500, `Lembrete ${row.id} gravado com tipo inválido: ${row.kind}.`);
}

function toDto(row: TaskReminder): TaskReminderDto {
  return {
    id: row.id,
    recordId: row.recordId,
    kind: kindOf(row),
    at: row.at?.toISOString() ?? null,
    minutesBefore: row.minutesBefore,
    snoozedUntil: row.snoozedUntil?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

const candidateInclude = { record: { select: { id: true, body: true, dueAt: true, dueHasTime: true } } } as const;

/** Lembretes no Postgres, pelo Prisma. */
@Injectable()
export class ReminderRepository implements ReminderStore {
  constructor(private readonly prisma: PrismaService) {}

  async task(recordId: string) {
    const row = await this.prisma.record.findUnique({ where: { id: recordId }, select: { type: true, _count: { select: { reminders: true } } } });
    return row ? { type: row.type, reminders: row._count.reminders } : null;
  }

  async list(recordId: string): Promise<TaskReminderDto[]> {
    const rows = await this.prisma.taskReminder.findMany({ where: { recordId }, orderBy: { createdAt: "asc" } });
    return rows.map(toDto);
  }

  async add(recordId: string, write: ReminderWrite): Promise<TaskReminderDto> {
    return toDto(await this.prisma.taskReminder.create({ data: { recordId, ...write } }));
  }

  async remove(id: string): Promise<boolean> {
    return (await this.prisma.taskReminder.deleteMany({ where: { id } })).count > 0;
  }

  async snooze(id: string, until: Date): Promise<boolean> {
    return (await this.prisma.taskReminder.updateMany({ where: { id }, data: { snoozedUntil: until } })).count > 0;
  }

  // Tarefa concluída não lembra mais; reaberta volta a lembrar.
  async candidates(): Promise<ReminderCandidate[]> {
    const rows = await this.prisma.taskReminder.findMany({
      where: { record: { type: "task", status: { not: "done" } } },
      include: candidateInclude,
    });
    return rows.map((row) => ({ ...row, kind: kindOf(row), task: row.record }));
  }

  async markSent(id: string, fireAt: Date): Promise<void> {
    await this.prisma.taskReminder.updateMany({ where: { id }, data: { sentFor: fireAt } });
  }
}
