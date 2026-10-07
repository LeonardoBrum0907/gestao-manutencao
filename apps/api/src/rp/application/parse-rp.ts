import { RP_FOUR_M, isRpStatus, type RpCauseDto, type RpFields, type RpFourM } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalString, readObject, requiredString } from "../../kernel/parse";
import { RP_TEXT_MAX_LENGTH } from "../domain/rp-text";

export type RpInput = { fields: RpFields; occurredAt: Date; rawText: string; chamadoId: string | null };

function flag(source: Record<string, unknown>, key: string): boolean {
  const value = source[key];
  if (value === undefined || value === null) return false;
  if (typeof value !== "boolean") throw new DomainError("invalid", 400, "Dados inválidos.");
  return value;
}

function stringList(source: Record<string, unknown>, key: string): string[] {
  const value = source[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new DomainError("invalid", 400, "Técnicos inválidos.");
  }
  return [...new Set((value as string[]).map((item) => item.trim()).filter(Boolean))];
}

function cause(source: Record<string, unknown>, key: RpFourM): RpCauseDto {
  const raw = source[key];
  if (raw === undefined || raw === null) return { marked: false, text: null };
  const item = readObject(raw);
  const text = optionalString(item, "text");
  return { marked: flag(item, "marked"), text };
}

// Dia do relatório: "2026-10-04" (a tela manda só o dia) ou uma data completa.
function reportDate(source: Record<string, unknown>): Date {
  const value = requiredString(source, "occurredAt", "Informe a data do relatório.");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00.000Z`) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new DomainError("invalid", 400, "Data inválida.");
  return date;
}

export function parseRp(body: unknown): RpInput {
  const source = readObject(body);
  const status = requiredString(source, "status", "Escolha o status.");
  if (!isRpStatus(status)) throw new DomainError("status", 400, "Status inválido.");
  const causesSource = source.causes === undefined || source.causes === null ? {} : readObject(source.causes);
  const causes = Object.fromEntries(RP_FOUR_M.map((key) => [key, cause(causesSource, key)])) as Record<RpFourM, RpCauseDto>;
  const occurredAt = reportDate(source);
  const rawText = typeof source.rawText === "string" ? source.rawText : "";
  if (rawText.length > RP_TEXT_MAX_LENGTH) throw new DomainError("invalid", 400, "O texto do relatório é grande demais.");
  const fields: RpFields = {
    occurredAt: occurredAt.toISOString(),
    orderNumber: optionalString(source, "orderNumber"),
    factoryId: requiredString(source, "factoryId", "Escolha a fábrica."),
    lineId: optionalString(source, "lineId"),
    line: optionalString(source, "line"),
    tag: optionalString(source, "tag"),
    problem: requiredString(source, "problem", "Descreva o problema."),
    description: optionalString(source, "description"),
    repeatedFailure: flag(source, "repeatedFailure"),
    repeatedTimes: optionalString(source, "repeatedTimes"),
    repeatedPeriod: optionalString(source, "repeatedPeriod"),
    causes,
    rootCause: optionalString(source, "rootCause"),
    corrective: optionalString(source, "corrective"),
    preventive: optionalString(source, "preventive"),
    status,
    basicConditionImpact: optionalString(source, "basicConditionImpact"),
    memberIds: stringList(source, "memberIds"),
    unmatchedTechnicians: optionalString(source, "unmatchedTechnicians"),
  };
  return { fields, occurredAt, rawText, chamadoId: optionalString(source, "chamadoId") };
}

export function parseRpText(body: unknown): string {
  const source = readObject(body);
  return requiredString(source, "text", "Cole o texto do relatório.");
}
