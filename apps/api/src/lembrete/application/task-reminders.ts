import { Inject, Injectable } from "@nestjs/common";
import type { TaskReminderDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { assertCanAddReminder, parseReminderBody } from "../domain/reminder-input";
import { REMINDER_STORE, type ReminderStore } from "./reminder-ports";

// "Adiar 1 h" da notificação.
export const SNOOZE_MS = 60 * 60 * 1000;

/** Lembretes da ficha da tarefa: listar, criar, tirar e adiar. */
@Injectable()
export class TaskReminders {
  constructor(@Inject(REMINDER_STORE) private readonly store: ReminderStore) {}

  list(recordId: string): Promise<TaskReminderDto[]> {
    return this.store.list(recordId);
  }

  async add(recordId: string, body: unknown): Promise<TaskReminderDto> {
    const write = parseReminderBody(body);
    const task = await this.store.task(recordId);
    assertCanAddReminder(task, task?.reminders ?? 0);
    return this.store.add(recordId, write);
  }

  async remove(id: string): Promise<void> {
    if (!(await this.store.remove(id))) throw new DomainError("not_found", 404, `Lembrete não encontrado: ${id}.`);
  }

  /**
   * Toca de novo daqui a 1 h.
   * @example await reminders.snooze("rem1", new Date()) // { snoozedUntil: "…+1 h" }
   */
  async snooze(id: string, now: Date): Promise<{ snoozedUntil: string }> {
    const until = new Date(now.getTime() + SNOOZE_MS);
    if (!(await this.store.snooze(id, until))) throw new DomainError("not_found", 404, `Lembrete não encontrado: ${id}.`);
    return { snoozedUntil: until.toISOString() };
  }
}
