import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";
import type { EntryInput } from "../domain/matrix";

function optionalNumber(source: Record<string, unknown>, key: string, message: string): number | null {
  const value = source[key];
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number") throw new DomainError("invalid", 400, message);
  return value;
}

export function parseEntry(body: unknown): EntryInput {
  const source = readObject(body);
  const notApplicable = source.notApplicable ?? false;
  if (typeof notApplicable !== "boolean") throw new DomainError("invalid", 400, "Dados inválidos.");
  return {
    score: optionalNumber(source, "score", "A nota vai de 0 a 4."),
    notApplicable,
    expected: optionalNumber(source, "expected", "O esperado vai de 1 a 4."),
  };
}

export function parseEquipments(body: unknown): unknown {
  return readObject(body).equipments;
}
