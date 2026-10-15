import type { PushMessage, PushSendResultDto, TaskReminderDto } from "@manutencao/shared";
import type { ReminderWrite } from "../domain/reminder-input";
import type { ReminderCandidate } from "../domain/reminder-schedule";
import type { ReminderPush, ReminderStore } from "./reminder-ports";

/** Banco de lembretes em memória para os testes. */
export class FakeReminderStore implements ReminderStore {
  readonly tasks = new Map<string, { type: string }>();
  candidatesList: ReminderCandidate[] = [];
  readonly reminders: TaskReminderDto[] = [];
  readonly sent: { id: string; fireAt: string }[] = [];
  private nextId = 1;

  async task(recordId: string) {
    const task = this.tasks.get(recordId);
    return task ? { type: task.type, reminders: this.reminders.filter((item) => item.recordId === recordId).length } : null;
  }

  async list(recordId: string) {
    return this.reminders.filter((item) => item.recordId === recordId);
  }

  async add(recordId: string, write: ReminderWrite) {
    const reminder: TaskReminderDto = { id: `r${this.nextId++}`, recordId, kind: write.kind, at: write.at?.toISOString() ?? null, minutesBefore: write.minutesBefore, snoozedUntil: null, createdAt: new Date(0).toISOString() };
    this.reminders.push(reminder);
    return reminder;
  }

  async remove(id: string) {
    const index = this.reminders.findIndex((item) => item.id === id);
    if (index >= 0) this.reminders.splice(index, 1);
    return index >= 0;
  }

  async snooze(id: string, until: Date) {
    const reminder = this.reminders.find((item) => item.id === id);
    if (reminder) reminder.snoozedUntil = until.toISOString();
    return reminder !== undefined;
  }

  async candidates() {
    return this.candidatesList;
  }

  async markSent(id: string, fireAt: Date) {
    this.sent.push({ id, fireAt: fireAt.toISOString() });
  }
}

/** Envio falso: guarda as mensagens e devolve o resultado combinado no teste. */
export class FakeReminderPush implements ReminderPush {
  readonly messages: PushMessage[] = [];
  constructor(private readonly result: PushSendResultDto | Error = { sent: 1, removed: 0, failed: 0 }) {}

  async deliver(message: PushMessage) {
    this.messages.push(message);
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }
}
