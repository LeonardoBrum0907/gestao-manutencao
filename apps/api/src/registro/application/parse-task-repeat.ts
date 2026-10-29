import { readTaskRepeat, type RecordType, type TaskRepeat } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

const EXPECTED =
  '{ every: "day" }, { every: "workday" }, { every: "week", interval: 1 ou 2, weekdays: [0 a 6], since: "AAAA-MM-DD" } ou { every: "month", dayOfMonth: 1 a 31 }';

/**
 * Regra de repetição na ficha. Sem o campo, a regra fica como está (o MCP não manda); null tira a repetição.
 * Só tarefa repete: a ficha de outro tipo (inclusive a tarefa que virou problema) sai sem regra.
 * @example parseRepeatChange({ repeat: { every: "day" } }, "task") // { every: "day" }
 */
export function parseRepeatChange(body: unknown, type: RecordType): TaskRepeat | null | undefined {
  if (type !== "task") return null;
  if (!body || typeof body !== "object" || !("repeat" in body)) return undefined;
  const value = (body as { repeat: unknown }).repeat;
  if (value === null) return null;
  const rule = readTaskRepeat(value);
  if (!rule) throw new DomainError("repeat", 400, `Repetição inválida: ${JSON.stringify(value)}. Use ${EXPECTED}.`);
  return rule;
}
