import { isReminderKind, MAX_MINUTES_BEFORE, type ReminderKind, type TaskReminderBody } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";

/** Lembrete como vai para o banco. */
export type ReminderWrite = { kind: ReminderKind; at: Date | null; minutesBefore: number | null };

// Mais que isso numa tarefa só vira barulho no celular.
export const MAX_REMINDERS_PER_TASK = 5;

function readAt(value: unknown): Date {
  const at = typeof value === "string" ? new Date(value) : null;
  if (at && !Number.isNaN(at.getTime())) return at;
  throw new DomainError("at", 400, `Data e hora do lembrete inválida: ${JSON.stringify(value)}. Use ISO 8601 (ex.: 2026-10-16T07:30:00-03:00).`);
}

function readMinutesBefore(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_MINUTES_BEFORE) return value;
  throw new DomainError("minutesBefore", 400, `Minutos antes do prazo inválidos: ${JSON.stringify(value)}. Use um inteiro de 0 a ${MAX_MINUTES_BEFORE}.`);
}

/**
 * Lê o lembrete que a tela manda: data e hora fixa ou minutos antes do prazo.
 * @example parseReminderBody({ kind: "before", minutesBefore: 60 }) // { kind: "before", at: null, minutesBefore: 60 }
 */
export function parseReminderBody(body: unknown): ReminderWrite {
  const source = readObject(body);
  const kind = source.kind;
  if (typeof kind !== "string" || !isReminderKind(kind)) {
    throw new DomainError("kind", 400, `Tipo de lembrete inválido: ${JSON.stringify(kind)}. Use "at" ou "before".`);
  }
  if (kind === "at") return { kind, at: readAt(source.at), minutesBefore: null };
  return { kind, at: null, minutesBefore: readMinutesBefore(source.minutesBefore) };
}

/**
 * Converte um lembrete já validado (o padrão da tarefa alta, por exemplo) para gravar.
 * @example reminderWrite({ kind: "before", minutesBefore: 60 }) // { kind: "before", at: null, minutesBefore: 60 }
 */
export function reminderWrite(body: TaskReminderBody): ReminderWrite {
  if (body.kind === "at") return { kind: "at", at: new Date(body.at), minutesBefore: null };
  return { kind: "before", at: null, minutesBefore: body.minutesBefore };
}

/** Só tarefa tem lembrete, e até MAX_REMINDERS_PER_TASK. */
export function assertCanAddReminder(task: { type: string } | null, existing: number): void {
  if (!task) throw new DomainError("not_found", 404, "Tarefa não encontrada.");
  if (task.type !== "task") throw new DomainError("wrong_type", 400, `Lembrete fica só em tarefa (este registro é ${task.type}).`);
  if (existing >= MAX_REMINDERS_PER_TASK) {
    throw new DomainError("reminders", 400, `A tarefa já tem ${existing} lembretes; o máximo é ${MAX_REMINDERS_PER_TASK}.`);
  }
}
