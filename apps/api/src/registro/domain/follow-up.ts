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

export function calendarDay(instant: Date, timeZone: string = GESTOR_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
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
  if (subject.type !== "task" || subject.dueAt === null) return false;
  return taskDueWindow(subject.dueAt, now) === filter.due;
}
