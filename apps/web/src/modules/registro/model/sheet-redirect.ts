import type { RecordDto, RecordType } from "@manutencao/shared";
import { chamadoHref, dayOf } from "../../turno/model/chamado";

// Onde o modal do registro abre: rascunho na Entrada, o resto em Registros, já no tipo dele.
const listOf: Record<RecordType, string> = {
  entry: "/entrada?",
  task: "/registros?tipo=tarefas&situacao=todos&",
  problem: "/registros?tipo=problemas&situacao=todos&",
  feedback: "/registros?tipo=feedbacks&situacao=todos&",
};

/**
 * Para onde a ficha /registros/:id manda o registro que tem tela própria; nulo quando a ficha mostra ele mesma.
 * Chamado abre a lista do dia dele, com o painel aberto; registro lançado pela Entrada abre no modal, por cima
 * da lista do tipo dele; problema de RP abre a ficha do RP (`rpId`, nulo enquanto não se sabe qual é).
 * @example sheetRedirect({ id: "r1", type: "task", origin: "inbox", occurredAt }) // "/registros?tipo=tarefas&situacao=todos&registro=r1"
 */
export function sheetRedirect(record: Pick<RecordDto, "id" | "type" | "origin" | "occurredAt">, rpId: string | null = null): string | null {
  if (record.origin === "chamado") return chamadoHref({ id: record.id, day: dayOf(new Date(record.occurredAt)) });
  if (record.origin === "inbox") return `${listOf[record.type]}registro=${record.id}`;
  // O problema de um RP é só o espelho: a ficha de verdade é a do RP, onde ele se altera e se exclui.
  if (record.origin === "rp" && rpId) return `/rp/${rpId}`;
  return null;
}
