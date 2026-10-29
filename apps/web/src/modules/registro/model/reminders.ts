import {
  GESTOR_TIME_ZONE,
  MINUTES_PER_DAY,
  REMINDER_MORNING_HOUR,
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

/** Quando, curto, para a coluna de horas dos atalhos: "Hoje, 13:30", "30 out, 07:00". */
export function fireShortText(at: Date, today: string): string {
  return `${dayLabel(dueDay(at.toISOString()), today)}, ${clockFormat.format(at)}`;
}

/** Texto do lembrete na ficha: em destaque, quando toca; embaixo, de onde vem essa hora. */
export type ReminderText = { title: string; detail: string };

function dayOnlyRule(minutesBefore: number): string {
  const days = Math.floor(minutesBefore / MINUTES_PER_DAY);
  const when = days === 0 ? "No dia do prazo" : days === 1 ? "Na véspera do prazo" : `${days} dias antes do prazo`;
  return `${when}, às ${REMINDER_MORNING_HOUR}h`;
}

function ruleText(reminder: TaskReminderDto, due: ReminderDue): string {
  if (reminder.kind === "at") return "Hora marcada";
  const minutes = reminder.minutesBefore ?? 0;
  if (due.dueAt !== null && !due.dueHasTime) return dayOnlyRule(minutes);
  return minutes === 0 ? "Na hora do prazo" : `${beforeLabel(minutes, true)} do prazo`;
}

/**
 * Título e detalhe de um lembrete. Adiado pela notificação, o detalhe diz para quando.
 * Ex.: `reminderText({ kind: "before", minutesBefore: 60, … }, { dueAt, dueHasTime: true }, "2026-10-16")`
 * → `{ title: "Hoje às 13:30", detail: "1 h antes do prazo" }`
 */
export function reminderText(reminder: TaskReminderDto, due: ReminderDue, today: string, now: Date = new Date()): ReminderText {
  const snoozed = reminder.snoozedUntil ? new Date(reminder.snoozedUntil) : null;
  const fireAt = reminderFireAt(reminder, due);
  // Sem prazo, o "antes do prazo" ainda não tem hora: a regra vira o título até o prazo chegar.
  const title = fireAt ? fireText(fireAt, today) : beforeLabel(reminder.minutesBefore ?? 0, true);
  if (snoozed && snoozed > now) return { title, detail: `Adiado para ${fireText(snoozed, today).toLowerCase()}` };
  return { title, detail: fireAt ? ruleText(reminder, due) : "Toca quando a tarefa tiver prazo" };
}

/**
 * Lembretes na ordem em que tocam; os que esperam o prazo ficam no fim, na ordem em que foram criados.
 * Ex.: `sortedByFire([depois, antes], due)` → `[antes, depois]`
 */
export function sortedByFire(reminders: TaskReminderDto[], due: ReminderDue): TaskReminderDto[] {
  const fireTime = (reminder: TaskReminderDto) => reminderFireAt(reminder, due)?.getTime() ?? Number.POSITIVE_INFINITY;
  return [...reminders].sort((first, second) => fireTime(first) - fireTime(second));
}
