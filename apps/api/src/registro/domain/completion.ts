import type { RecordStatus } from "@manutencao/shared";

/** O que gravar na data de conclusão ao salvar um registro com este status. */
export type CompletionWrite = "stamp-if-empty" | "clear";

/**
 * Concluir grava a hora só se ainda não tem: editar o texto de um concluído não muda o dia em que ele foi concluído.
 * Voltar para aberto ou em andamento apaga a data, para a semana de conclusão não contar o que foi reaberto.
 * @example completionWrite("done") // "stamp-if-empty"
 */
export function completionWrite(status: RecordStatus): CompletionWrite {
  return status === "done" ? "stamp-if-empty" : "clear";
}
