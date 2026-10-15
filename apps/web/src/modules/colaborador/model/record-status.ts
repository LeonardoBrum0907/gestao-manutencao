import type { RecordListItemDto } from "@manutencao/shared";
import { recordStatusLabel } from "../../registro/model/record";

/**
 * Situação de um registro na ficha do colaborador, com a mesma palavra da lista de Registros
 * (tarefa "Aberta"/"Concluída", problema "Resolvido"). Feedback não tem situação: devolve null e a coluna fica vazia.
 * @example memberRecordStatus({ type: "problem", status: "done" }) // "Resolvido"
 */
export function memberRecordStatus(record: Pick<RecordListItemDto, "type" | "status">): string | null {
  if (record.type === "feedback") return null;
  return recordStatusLabel(record.type, record.status);
}
