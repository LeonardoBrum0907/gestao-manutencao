import {
  GESTOR_TIME_ZONE,
  isBoardTarget,
  isRecordStatus,
  type BoardGroup,
  type BoardTarget,
  type RecordOrigin,
  type RecordStatus,
  type RecordType,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { parseDueDay } from "./agenda-day";
import { calendarDay, nextCalendarDay, startOfDay, taskDueWindow } from "./follow-up";

// Concluída some do checklist depois de uma semana (feedback conversado, depois de um mês); o histórico
// continua na ficha e nos relatórios.
export const DONE_WINDOW_DAYS = 7;
export const FEEDBACK_DONE_WINDOW_DAYS = 30;
export const MAX_ORDER = 500;

export type BoardSubject = {
  status: RecordStatus;
  dueAt: Date | null;
};

export function boardGroup(subject: BoardSubject, now: Date, timeZone: string = GESTOR_TIME_ZONE): BoardGroup {
  if (subject.status === "done") return "done";
  if (!subject.dueAt) return "undated";
  const window = taskDueWindow(subject.dueAt, now, timeZone);
  if (window === "overdue") return "overdue";
  if (window === "today") return "today";
  return "upcoming";
}

const NOON_MS = 12 * 60 * 60 * 1000;

// Arrastar para Hoje ou Próximos dias marca o prazo ao meio-dia (hoje ou amanhã) no fuso do gestor.
export function boardDueAt(target: BoardTarget, now: Date, timeZone: string = GESTOR_TIME_ZONE): Date | null {
  if (target === "undated") return null;
  const today = calendarDay(now, timeZone);
  const day = target === "today" ? today : nextCalendarDay(today);
  return new Date(startOfDay(day, timeZone).getTime() + NOON_MS);
}

export function doneSince(now: Date, days: number = DONE_WINDOW_DAYS): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export type BoardSortable = {
  id: string;
  boardPosition: number | null;
  dueAt: Date | null;
  occurredAt: Date;
};

// A ordem que o gestor deixou ao arrastar vem primeiro; o que nunca foi arrastado segue o prazo e,
// sem prazo, o mais recente no topo.
export function compareBoard(a: BoardSortable, b: BoardSortable): number {
  if (a.boardPosition !== null || b.boardPosition !== null) {
    if (a.boardPosition === null) return 1;
    if (b.boardPosition === null) return -1;
    if (a.boardPosition !== b.boardPosition) return a.boardPosition - b.boardPosition;
  }
  if (a.dueAt && b.dueAt && a.dueAt.getTime() !== b.dueAt.getTime()) return a.dueAt.getTime() - b.dueAt.getTime();
  if (a.dueAt && !b.dueAt) return -1;
  if (!a.dueAt && b.dueAt) return 1;
  if (a.occurredAt.getTime() !== b.occurredAt.getTime()) return b.occurredAt.getTime() - a.occurredAt.getTime();
  return a.id.localeCompare(b.id);
}

export type BoardChange = {
  status: RecordStatus | null;
  target: BoardTarget | null;
  // Dia da Agenda ("AAAA-MM-DD"); não vem junto com target.
  day: string | null;
  order: string[] | null;
};

export function parseBoardChange(id: string, body: unknown): BoardChange {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new DomainError("invalid", 400, "Mudança inválida.");
  }
  const source = body as Record<string, unknown>;
  let status: RecordStatus | null = null;
  if (source.status !== undefined) {
    if (typeof source.status !== "string" || !isRecordStatus(source.status)) {
      throw new DomainError("status", 400, "Status inválido.");
    }
    status = source.status;
  }
  let target: BoardTarget | null = null;
  if (source.group !== undefined) {
    if (typeof source.group !== "string" || !isBoardTarget(source.group)) {
      throw new DomainError("group", 400, "Só dá para levar para Hoje, Próximos dias ou Sem prazo.");
    }
    target = source.group;
  }
  let day: string | null = null;
  if (source.day !== undefined) {
    if (target !== null) throw new DomainError("day", 400, "Escolha o grupo ou o dia, não os dois.");
    day = parseDueDay(source.day);
  }
  let order: string[] | null = null;
  if (source.order !== undefined) {
    const list = source.order;
    if (!Array.isArray(list) || list.length > MAX_ORDER || !list.every((item) => typeof item === "string" && item.length > 0)) {
      throw new DomainError("order", 400, "Ordem inválida.");
    }
    if (new Set(list).size !== list.length || !list.includes(id)) {
      throw new DomainError("order", 400, "Ordem inválida.");
    }
    order = list as string[];
  }
  if (status === null && target === null && day === null && order === null) {
    throw new DomainError("invalid", 400, "Nada para mudar.");
  }
  return { status, target, day, order };
}

export type BoardRecord = {
  type: RecordType;
  origin: RecordOrigin;
};

export function assertBoardChange(record: BoardRecord, change: BoardChange): void {
  if ((change.target !== null || change.day !== null) && record.type !== "task") {
    throw new DomainError("wrong_type", 400, "Só tarefa tem prazo.");
  }
  if (change.status !== null && record.origin === "rp") {
    throw new DomainError("wrong_origin", 400, "Este problema fecha pelo RP.");
  }
}
