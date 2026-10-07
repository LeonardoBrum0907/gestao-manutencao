import { isChamadoShift, isRecordPriority, isRecordStatus, type RecordStatus } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalDate, optionalString, readObject, requiredDate, requiredString } from "../../kernel/parse";
import type { ChamadoInput, ChamadoTaskInput, OcorrenciaInput } from "../domain/shift";

function stringList(source: Record<string, unknown>, key: string): string[] {
  const value = source[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new DomainError("invalid", 400, "Técnicos inválidos.");
  }
  return value;
}

export function parseChamado(body: unknown): ChamadoInput {
  const source = readObject(body);
  const status = requiredString(source, "status", "Escolha o status.");
  if (!isRecordStatus(status)) throw new DomainError("status", 400, "Status inválido.");
  const shift = optionalString(source, "shift");
  if (shift !== null && !isChamadoShift(shift)) throw new DomainError("shift", 400, "Turno inválido.");
  return {
    body: requiredString(source, "body", "Escreva o que aconteceu."),
    openedAt: requiredDate(source, "openedAt", "Informe a hora de abertura."),
    closedAt: optionalDate(source, "closedAt"),
    shift,
    memberIds: stringList(source, "memberIds"),
    lineId: optionalString(source, "lineId"),
    lineLabel: optionalString(source, "lineLabel"),
    machineId: optionalString(source, "machineId"),
    status: status as RecordStatus,
    notes: optionalString(source, "notes"),
  };
}

export function parseChamadoTask(body: unknown): ChamadoTaskInput {
  const source = readObject(body);
  const priority = optionalString(source, "priority");
  if (priority !== null && !isRecordPriority(priority)) throw new DomainError("priority", 400, "Prioridade inválida.");
  return {
    body: requiredString(source, "body", "Escreva o que falta fazer."),
    dueAt: requiredDate(source, "dueAt", "Informe o prazo."),
    memberId: optionalString(source, "memberId"),
    priority,
  };
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LIST = 200;

export type ChamadoListQuery = { day?: unknown; lineId?: unknown; limit?: unknown };
export type ChamadoListFilter = { day: string | null; lineId: string | null; limit: number };

// Ou o dia inteiro (a tela do turno) ou os mais recentes de uma linha (a tela da máquina).
export function parseChamadoList(query: ChamadoListQuery): ChamadoListFilter {
  const day = typeof query.day === "string" && query.day ? query.day : null;
  const lineId = typeof query.lineId === "string" && query.lineId ? query.lineId : null;
  if (day !== null && !DAY.test(day)) throw new DomainError("invalid", 400, "Dia inválido.");
  if (!day && !lineId) throw new DomainError("invalid", 400, "Informe o dia ou a linha.");
  const raw = typeof query.limit === "string" ? Number(query.limit) : MAX_LIST;
  const limit = Number.isInteger(raw) && raw > 0 ? Math.min(raw, MAX_LIST) : MAX_LIST;
  return { day, lineId, limit };
}

export function parseOcorrencia(body: unknown): OcorrenciaInput {
  const source = readObject(body);
  return {
    factoryId: requiredString(source, "factoryId", "Escolha a fábrica."),
    line: requiredString(source, "line", "Informe a linha."),
    body: requiredString(source, "body", "Escreva a ocorrência."),
  };
}
