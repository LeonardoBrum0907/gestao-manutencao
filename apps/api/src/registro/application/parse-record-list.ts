import { isDueWindow, isRecordStatus, isRecordType, type DueWindow } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, type RecordListFilter } from "../domain/record-list";

function single(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function list(value: unknown): string[] | null {
  const text = single(value);
  if (!text) return null;
  const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length ? parts : null;
}

function choices<T extends string>(value: unknown, guard: (input: string) => input is T): T[] | null {
  const parts = list(value);
  if (!parts) return null;
  if (!parts.every(guard)) throw new DomainError("invalid", 400, "Filtro inválido.");
  return parts;
}

export type RecordListQuery = {
  type?: unknown;
  status?: unknown;
  due?: unknown;
  machineIds?: unknown;
  memberId?: unknown;
  cursor?: unknown;
  limit?: unknown;
};

export function parseRecordList(query: RecordListQuery): RecordListFilter {
  const due = single(query.due);
  if (due && !isDueWindow(due)) throw new DomainError("invalid", 400, "Filtro inválido.");
  const rawLimit = single(query.limit);
  const limit = rawLimit === undefined ? DEFAULT_PAGE_SIZE : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    throw new DomainError("invalid", 400, `O limite vai de 1 a ${MAX_PAGE_SIZE}.`);
  }
  return {
    types: choices(query.type, isRecordType),
    statuses: choices(query.status, isRecordStatus),
    due: (due as DueWindow | undefined) ?? null,
    machineIds: list(query.machineIds),
    memberId: single(query.memberId) || null,
    cursor: single(query.cursor) || null,
    limit,
  };
}
