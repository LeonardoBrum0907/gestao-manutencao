import type { PushMessage, PushSendResultDto, TaskReminderDto } from "@manutencao/shared";
import type { ReminderWrite } from "../domain/reminder-input";
import type { ReminderCandidate } from "../domain/reminder-schedule";

export interface ReminderStore {
  /** Tipo do registro (só tarefa tem lembrete) e quantos lembretes ele já tem; nulo se não existe. */
  task(recordId: string): Promise<{ type: string; reminders: number } | null>;
  list(recordId: string): Promise<TaskReminderDto[]>;
  add(recordId: string, write: ReminderWrite): Promise<TaskReminderDto>;
  remove(id: string): Promise<boolean>;
  snooze(id: string, until: Date): Promise<boolean>;
  /** Lembretes de tarefas ainda por fazer, com o prazo delas. */
  candidates(): Promise<ReminderCandidate[]>;
  markSent(id: string, fireAt: Date): Promise<void>;
}

/** Envio para os aparelhos inscritos (PushDevices do módulo de avisos). */
export interface ReminderPush {
  deliver(message: PushMessage, now: Date): Promise<PushSendResultDto>;
}

export const REMINDER_STORE = Symbol("REMINDER_STORE");
export const REMINDER_PUSH = Symbol("REMINDER_PUSH");
