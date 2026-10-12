import { GESTOR_TIME_ZONE } from "@manutencao/shared";

const dueDayFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: GESTOR_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDueDay(iso: string): string {
  return dueDayFormat.format(new Date(iso));
}

const calendarDayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: GESTOR_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function calendarDay(instant: Date): string {
  return calendarDayFormat.format(instant);
}

export function dueTone(iso: string, now = new Date()): "overdue" | "today" | "later" {
  const due = calendarDay(new Date(iso));
  const today = calendarDay(now);
  if (due < today) return "overdue";
  if (due === today) return "today";
  return "later";
}
