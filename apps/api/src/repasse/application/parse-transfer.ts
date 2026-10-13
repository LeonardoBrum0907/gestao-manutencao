import type { TransferCreateBody } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject, requiredString } from "../../kernel/parse";

function readIds(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((id) => typeof id !== "string" || !id.trim())) {
    throw new DomainError("invalid", 400, `equipmentIds inválido (${JSON.stringify(value)}): use uma lista de ids de equipamento.`);
  }
  return value.map((id: string) => id.trim());
}

/**
 * Corpo do POST /api/transfers. Sem equipmentIds, o foco é a matriz inteira de quem ensina.
 * @example parseTransferCreate({ teacherId: "m1", learnerId: "m2", equipmentIds: ["e1"] })
 */
export function parseTransferCreate(body: unknown): TransferCreateBody {
  const source = readObject(body);
  return {
    teacherId: requiredString(source, "teacherId", "Escolha quem ensina."),
    learnerId: requiredString(source, "learnerId", "Escolha quem aprende."),
    equipmentIds: readIds(source.equipmentIds),
  };
}

/**
 * Lista de ids na URL (?equipmentIds=e1,e2).
 * @example parseIdList("e1, e2") // ["e1", "e2"]
 */
export function parseIdList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").map((id) => id.trim()).filter(Boolean);
}
