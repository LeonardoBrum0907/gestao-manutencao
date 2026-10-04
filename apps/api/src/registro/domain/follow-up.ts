import {
  GESTOR_TIME_ZONE,
  type DueWindow,
  type RecordStatus,
  type RecordType,
} from "@manutencao/shared";

export type FollowUpSubject = {
  type: RecordType;
  status: RecordStatus;
  dueAt: Date | null;
};

export type FollowUpFilter = {
  type: RecordType | null;
  status: RecordStatus | null;
  due: DueWindow | null;
};

// Criar um Intl.DateTimeFormat custa ~100× mais que usar um pronto, e isto roda por registro.
const dayFormatters = new Map<string, Intl.DateTimeFormat>();

function dayFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = dayFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    dayFormatters.set(timeZone, formatter);
  }
  return formatter;
}

export function calendarDay(instant: Date, timeZone: string = GESTOR_TIME_ZONE): string {
  return dayFormatter(timeZone).format(instant);
}

const clockFormatters = new Map<string, Intl.DateTimeFormat>();

function offsetMs(instant: Date, timeZone: string): number {
  let formatter = clockFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    clockFormatters.set(timeZone, formatter);
  }
  const part = (type: string) => Number(formatter.formatToParts(instant).find((item) => item.type === type)?.value);
  const wall = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"));
  return wall - Math.floor(instant.getTime() / 1000) * 1000;
}

// O instante em que o dia "AAAA-MM-DD" começa no fuso do gestor.
export function startOfDay(day: string, timeZone: string = GESTOR_TIME_ZONE): Date {
  const [year, month, date] = day.split("-").map(Number);
  const guess = Date.UTC(year, month - 1, date);
  const first = guess - offsetMs(new Date(guess), timeZone);
  return new Date(guess - offsetMs(new Date(first), timeZone));
}

// A mesma regra de taskDueWindow, escrita como intervalo de datas para o banco filtrar em vez do Node.
export function dueRange(window: DueWindow, now: Date, timeZone: string = GESTOR_TIME_ZONE): { gte?: Date; lt?: Date } {
  const today = calendarDay(now, timeZone);
  const tomorrow = nextCalendarDay(today);
  if (window === "overdue") return { lt: startOfDay(today, timeZone) };
  if (window === "today") return { gte: startOfDay(today, timeZone), lt: startOfDay(tomorrow, timeZone) };
  return { gte: startOfDay(tomorrow, timeZone), lt: startOfDay(nextCalendarDay(tomorrow), timeZone) };
}

export function nextCalendarDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + 1)).toISOString().slice(0, 10);
}

export function taskDueWindow(dueAt: Date, now: Date, timeZone: string = GESTOR_TIME_ZONE): DueWindow | "later" {
  const due = calendarDay(dueAt, timeZone);
  const today = calendarDay(now, timeZone);
  if (due < today) return "overdue";
  if (due === today) return "today";
  if (due === nextCalendarDay(today)) return "tomorrow";
  return "later";
}

export function matchesFollowUp(subject: FollowUpSubject, filter: FollowUpFilter, now: Date): boolean {
  if (filter.type && subject.type !== filter.type) return false;
  if (filter.status && subject.status !== filter.status) return false;
  if (!filter.due) return true;
  // Prazo é de tarefa ainda por fazer: concluída não vence nem vence hoje.
  if (subject.type !== "task" || subject.dueAt === null || subject.status === "done") return false;
  return taskDueWindow(subject.dueAt, now) === filter.due;
}
