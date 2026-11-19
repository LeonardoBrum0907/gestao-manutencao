/** Campo do formulário do RP que um aviso do Colar do WhatsApp pede para conferir. */
export type RpPasteWarningField = "occurredAt" | "factoryId" | "lineId" | "machineId" | "tag" | "problem" | "status" | "memberIds";

// O começo de cada aviso que a leitura do texto monta (apps/api/src/rp/domain/rp-text.ts e rp/application/rp-drafts.ts;
// o da TAG de outra linha vem do web, rp/model/rp-machine-tag.ts). Mudou o texto de um aviso: mude aqui também,
// senão ele deixa de sumir quando a pessoa corrige o campo (pedido do Léo, 2026-11-19).
const WARNING_FIELDS: readonly (readonly [string, readonly RpPasteWarningField[]])[] = [
  ["Data ", ["occurredAt"]],
  ["Linha não encontrada", ["lineId", "factoryId"]],
  ["A TAG ", ["lineId", "machineId", "tag"]],
  ["Status ", ["status"]],
  ["Não encontrei o problema", ["problem"]],
  ["Técnico ", ["memberIds"]],
];

/**
 * Campos que resolvem um aviso da leitura do texto colado: quando a pessoa preenche um deles, o aviso some.
 * Aviso sem campo (ex.: "O texto tem 2 relatórios") devolve lista vazia e fica na tela.
 * @example rpPasteWarningFields("Data não encontrada: confira a data.") // ["occurredAt"]
 */
export function rpPasteWarningFields(warning: string): readonly RpPasteWarningField[] {
  return WARNING_FIELDS.find(([start]) => warning.startsWith(start))?.[1] ?? [];
}
