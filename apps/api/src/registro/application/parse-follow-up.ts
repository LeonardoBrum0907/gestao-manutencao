import { isDueWindow, isRecordStatus, isRecordType, type DueWindow, type RecordStatus, type RecordType } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import type { FollowUpFilter } from "../domain/follow-up";

function single(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function readChoice<T extends string>(
  value: unknown,
  guard: (input: string) => input is T,
): T | null {
  const text = single(value);
  if (!text) return null;
  if (!guard(text)) throw new DomainError("invalid", 400, "Filtro inválido.");
  return text;
}

export function parseFollowUpQuery(query: {
  type?: unknown;
  status?: unknown;
  due?: unknown;
}): FollowUpFilter {
  return {
    type: readChoice<RecordType>(query.type, isRecordType),
    status: readChoice<RecordStatus>(query.status, isRecordStatus),
    due: readChoice<DueWindow>(query.due, isDueWindow),
  };
}
