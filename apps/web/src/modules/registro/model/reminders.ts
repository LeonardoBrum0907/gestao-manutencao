import {
  BEFORE_OPTIONS_DAY_ONLY,
  BEFORE_OPTIONS_TIMED,
  GESTOR_TIME_ZONE,
  beforeLabel,
  reminderFireAt,
  type ReminderDue,
  type TaskReminderDto,
} from "@manutencao/shared";
import { dayLabel, dueDay } from "./board";

const clockFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: GESTOR_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Quando, em palavras: "Hoje às 13:30", "Amanhã às 07:00", "16 out às 07:00". */
export function fireText(at: Date, today: string): string {
  return `${dayLabel(dueDay(at.toISOString()), today)} às ${clockFormat.format(at)}`;
}

/** Texto do lembrete na ficha: o que ele é e quando toca. */
export type ReminderText = { label: string; when: string | null };

function whenText(reminder: TaskReminderDto, due: ReminderDue, today: string, now: Date): string | null {
  const snoozed = reminder.snoozedUntil ? new Date(reminder.snoozedUntil) : null;
  if (snoozed && snoozed > now) return `Adiado para ${fireText(snoozed, today).toLowerCase()}`;
  if (reminder.kind === "at") return null;
  const fireAt = reminderFireAt(reminder, due);
  return fireAt ? fireText(fireAt, today) : "Toca quando a tarefa tiver prazo";
}

/**
 * Rótulo e hora de tocar de um lembrete.
 * Ex.: `reminderText({ kind: "before", minutesBefore: 60, … }, { dueAt, dueHasTime: true }, "2026-10-16")` → `{ label: "1 h antes", when: "Hoje às 13:30" }`
 */
export function reminderText(reminder: TaskReminderDto, due: ReminderDue, today: string, now: Date = new Date()): ReminderText {
  // Sem prazo, mostra a regra como foi escolhida ("1 h antes"); ela se ajusta quando o prazo chegar.
  const timed = due.dueAt === null || due.dueHasTime;
  const label = reminder.kind === "at" && reminder.at ? fireText(new Date(reminder.at), today) : beforeLabel(reminder.minutesBefore ?? 0, timed);
  return { label, when: whenText(reminder, due, today, now) };
}

/** Opções de "Antes do prazo": com horário no prazo, minutos e horas; só com dia, 7h do dia ou da véspera. */
export function beforeOptions(dueHasTime: boolean): { value: number; label: string }[] {
  const minutes = dueHasTime ? BEFORE_OPTIONS_TIMED : BEFORE_OPTIONS_DAY_ONLY;
  return minutes.map((value) => ({ value, label: beforeLabel(value, dueHasTime) }));
}
