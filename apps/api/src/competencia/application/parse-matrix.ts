import { DomainError } from "../../kernel/domain-error";
import { readObject, requiredString } from "../../kernel/parse";
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

export const MAX_BULK_ENTRIES = 500;

// Várias notas de uma vez (marcar um subconjunto ou um equipamento inteiro): a mesma regra de cada nota.
export function parseBulk(body: unknown): { skillId: string; input: EntryInput }[] {
  const entries = readObject(body).entries;
  if (!Array.isArray(entries) || entries.length === 0 || entries.length > MAX_BULK_ENTRIES) {
    throw new DomainError("invalid", 400, `Envie de 1 a ${MAX_BULK_ENTRIES} habilidades.`);
  }
  const parsed = entries.map((item) => ({
    skillId: requiredString(readObject(item), "skillId", "Habilidade inválida."),
    input: parseEntry(item),
  }));
  if (new Set(parsed.map((item) => item.skillId)).size !== parsed.length) {
    throw new DomainError("invalid", 400, "Habilidade repetida.");
  }
  return parsed;
}
