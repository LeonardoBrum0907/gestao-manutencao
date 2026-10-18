import { isRpSource, isRpStatus, type RpSource, type RpStatus } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, type RpListFilter } from "../domain/rp-list";

function single(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function day(value: unknown): string | null {
  const text = single(value);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(new Date(`${text}T00:00:00.000Z`).getTime())) {
    throw new DomainError("invalid", 400, "Data inválida.");
  }
  return text;
}

export type RpListQuery = {
  from?: unknown;
  to?: unknown;
  factoryId?: unknown;
  lineId?: unknown;
  line?: unknown;
  tag?: unknown;
  status?: unknown;
  memberId?: unknown;
  repeated?: unknown;
  source?: unknown;
  review?: unknown;
  q?: unknown;
  cursor?: unknown;
  limit?: unknown;
};

function origin(value: unknown): RpSource | null {
  const text = single(value);
  if (!text) return null;
  if (!isRpSource(text)) throw new DomainError("invalid", 400, `Origem inválida (recebido: ${text}; esperado: paste ou public).`);
  return text;
}

function reviewPending(value: unknown): boolean {
  const text = single(value);
  if (!text) return false;
  if (text !== "pending") throw new DomainError("invalid", 400, `Filtro de revisão inválido (recebido: ${text}; esperado: pending).`);
  return true;
}

export function parseRpList(query: RpListQuery): RpListFilter {
  const statusText = single(query.status);
  const statuses = statusText ? statusText.split(",").map((part) => part.trim()).filter(Boolean) : [];
  if (!statuses.every(isRpStatus)) throw new DomainError("invalid", 400, "Filtro inválido.");
  const repeated = single(query.repeated);
  if (repeated !== undefined && repeated !== "" && repeated !== "true" && repeated !== "false") {
    throw new DomainError("invalid", 400, "Filtro inválido.");
  }
  const rawLimit = single(query.limit);
  const limit = rawLimit === undefined ? DEFAULT_PAGE_SIZE : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    throw new DomainError("invalid", 400, `O limite vai de 1 a ${MAX_PAGE_SIZE}.`);
  }
  return {
    from: day(query.from),
    to: day(query.to),
    factoryId: single(query.factoryId) || null,
    lineId: single(query.lineId) || null,
    line: single(query.line)?.trim() || null,
    tag: single(query.tag)?.trim() || null,
    statuses: statuses.length ? (statuses as RpStatus[]) : null,
    memberId: single(query.memberId) || null,
    repeated: repeated === "true" ? true : repeated === "false" ? false : null,
    source: origin(query.source),
    reviewPending: reviewPending(query.review),
    q: single(query.q)?.trim() || null,
    cursor: single(query.cursor) || null,
    limit,
  };
}
