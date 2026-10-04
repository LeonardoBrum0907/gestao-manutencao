import { isRecordStatus, type RecordStatus } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalDate, optionalString, readObject, requiredString } from "../../kernel/parse";
import type { ChamadoInput, OcorrenciaInput } from "../domain/shift";

function optionalInt(source: Record<string, unknown>, key: string): number | null {
  const value = source[key];
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new DomainError("invalid", 400, "Número inválido.");
  }
  return value;
}

function requiredInt(source: Record<string, unknown>, key: string, message: string): number {
  const value = optionalInt(source, key);
  if (value === null) throw new DomainError("invalid", 400, message);
  return value;
}

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
  return {
    dayNumber: requiredInt(source, "dayNumber", "Informe o número do dia."),
    body: requiredString(source, "body", "Escreva a descrição do chamado."),
    openedAt: optionalDate(source, "openedAt"),
    closedAt: optionalDate(source, "closedAt"),
    durationMin: optionalInt(source, "durationMin"),
    memberIds: stringList(source, "memberIds"),
    machineId: optionalString(source, "machineId"),
    machineLabel: optionalString(source, "machineLabel"),
    status: status as RecordStatus,
    notes: optionalString(source, "notes"),
  };
}

export function parseOcorrencia(body: unknown): OcorrenciaInput {
  const source = readObject(body);
  return {
    factoryId: requiredString(source, "factoryId", "Escolha a fábrica."),
    line: requiredString(source, "line", "Informe a linha."),
    body: requiredString(source, "body", "Escreva a ocorrência."),
  };
}
