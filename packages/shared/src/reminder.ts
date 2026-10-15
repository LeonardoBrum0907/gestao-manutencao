import type { RecordPriority } from "./index";
import { GESTOR_TIME_ZONE } from "./time-zone";

// Lembretes nas tarefas (como no Todoist): numa data e hora fixa ou um tempo antes do prazo.
// A API usa estas regras para saber quando tocar; a tela, para escrever o rótulo do lembrete.

export const REMINDER_KINDS = ["at", "before"] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export function isReminderKind(value: string): value is ReminderKind {
  return (REMINDER_KINDS as readonly string[]).includes(value);
}

export type TaskReminderDto = {
  id: string;
  recordId: string;
  kind: ReminderKind;
  // "at": quando toca. "before": nulo.
  at: string | null;
  // "before": quantos minutos antes do prazo. "at": nulo.
  minutesBefore: number | null;
  // "Adiar 1 h" da notificação: toca de novo neste horário.
  snoozedUntil: string | null;
  createdAt: string;
};

export type TaskReminderBody = { kind: "at"; at: string } | { kind: "before"; minutesBefore: number };

/** O que o lembrete precisa saber da tarefa para achar a hora de tocar. */
export type ReminderDue = { dueAt: string | Date | null; dueHasTime: boolean };

export type ReminderRule = Pick<TaskReminderDto, "kind" | "at" | "minutesBefore">;

// Prazo só com dia: "antes do prazo" vira 7h do dia (ou de dias antes), decisão P do desenho dos avisos.
export const REMINDER_MORNING_HOUR = 7;
export const MINUTES_PER_DAY = 24 * 60;
// Até uma semana antes do prazo: mais que isso o lembrete perde o sentido e é engano de digitação.
export const MAX_MINUTES_BEFORE = 7 * MINUTES_PER_DAY;

/** Opções de "antes do prazo" na tela: com horário no prazo e só com dia. */
export const BEFORE_OPTIONS_TIMED = [0, 15, 30, 60, 120, MINUTES_PER_DAY] as const;
export const BEFORE_OPTIONS_DAY_ONLY = [0, MINUTES_PER_DAY] as const;

// Tarefa alta nasce com lembrete 1 h antes (decisão N); sem horário no prazo, vira 7h do dia.
export const DEFAULT_REMINDER_MINUTES = 60;

const MINUTE_MS = 60 * 1000;
// Brasília não tem horário de verão desde 2019: o fuso fixo -03:00 acha a hora certa (como dueAtOf no web).
const GESTOR_OFFSET = "-03:00";

const dueDayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: GESTOR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

function morningOf(due: Date, daysBefore: number): Date {
  const day = dueDayFormat.format(due);
  const morning = new Date(`${day}T${String(REMINDER_MORNING_HOUR).padStart(2, "0")}:00:00${GESTOR_OFFSET}`);
  return new Date(morning.getTime() - daysBefore * MINUTES_PER_DAY * MINUTE_MS);
}

/**
 * Quando o lembrete toca, sem contar o "Adiar". Nulo quando ele depende do prazo e a tarefa não tem prazo.
 * @example reminderFireAt({ kind: "before", at: null, minutesBefore: 60 }, { dueAt: "2026-10-16T17:30:00.000Z", dueHasTime: true }) // 16:30Z
 */
export function reminderFireAt(rule: ReminderRule, due: ReminderDue): Date | null {
  if (rule.kind === "at") return rule.at ? new Date(rule.at) : null;
  if (due.dueAt === null || rule.minutesBefore === null) return null;
  const dueAt = new Date(due.dueAt);
  if (!due.dueHasTime) return morningOf(dueAt, Math.floor(rule.minutesBefore / MINUTES_PER_DAY));
  return new Date(dueAt.getTime() - rule.minutesBefore * MINUTE_MS);
}

/**
 * Lembretes com que uma tarefa nasce ou ganha ao virar prioridade alta.
 * @example defaultTaskReminders("high") // [{ kind: "before", minutesBefore: 60 }]
 */
export function defaultTaskReminders(priority: RecordPriority | null): TaskReminderBody[] {
  return priority === "high" ? [{ kind: "before", minutesBefore: DEFAULT_REMINDER_MINUTES }] : [];
}

function durationLabel(minutes: number): string {
  if (minutes % MINUTES_PER_DAY === 0) return minutes === MINUTES_PER_DAY ? "1 dia" : `${minutes / MINUTES_PER_DAY} dias`;
  if (minutes % 60 === 0) return `${minutes / 60} h`;
  return `${minutes} min`;
}

/**
 * Rótulo de "antes do prazo": muda com o prazo ter horário ou não.
 * @example beforeLabel(60, true) // "1 h antes"
 * @example beforeLabel(60, false) // "No dia às 7h"
 */
export function beforeLabel(minutesBefore: number, dueHasTime: boolean): string {
  if (!dueHasTime) {
    const days = Math.floor(minutesBefore / MINUTES_PER_DAY);
    if (days === 0) return `No dia às ${REMINDER_MORNING_HOUR}h`;
    return `${durationLabel(days * MINUTES_PER_DAY)} antes às ${REMINDER_MORNING_HOUR}h`;
  }
  return minutesBefore === 0 ? "Na hora do prazo" : `${durationLabel(minutesBefore)} antes`;
}
