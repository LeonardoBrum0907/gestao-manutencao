import { isRpBulkAction, type RpBulkAction } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";
import { assertLength, REVIEW_MAX } from "./parse-public-rp";

// Uma página da lista: o supervisor marca no máximo o que está na tela de uma vez.
export const BULK_REVIEW_MAX_IDS = 100;

export type BulkReviewInput = { ids: string[]; action: RpBulkAction; note: string | null };

function parseIds(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((id) => typeof id === "string" && id)) {
    throw new DomainError("invalid", 400, "ids precisa ser uma lista de ids de RP.");
  }
  const ids = [...new Set(value as string[])];
  if (!ids.length || ids.length > BULK_REVIEW_MAX_IDS) {
    throw new DomainError("invalid", 400, `Marque de 1 a ${BULK_REVIEW_MAX_IDS} RPs (recebido: ${ids.length}).`);
  }
  return ids;
}

function parseAction(value: unknown): RpBulkAction {
  const text = typeof value === "string" ? value : "";
  if (isRpBulkAction(text)) return text;
  throw new DomainError("invalid", 400, `Ação inválida (recebido: ${text || "nada"}; esperado: approve, reject ou request_review).`);
}

// Pedido de revisão precisa dizer o que revisar; o motivo da recusa é opcional; aprovar não leva texto.
function parseNote(value: unknown, action: RpBulkAction): string | null {
  if (action === "approve") return null;
  const note = typeof value === "string" ? value.trim() : "";
  if (action === "request_review" && !note) throw new DomainError("invalid", 400, "Escreva o que precisa revisar.");
  assertLength(note, action === "reject" ? "O motivo da recusa" : "O pedido de revisão", REVIEW_MAX);
  return note || null;
}

/**
 * Lê o corpo da ação em lote da página pública.
 * @example parseBulkReview({ ids: ["rp1", "rp2"], action: "approve" }) // { ids: ["rp1", "rp2"], action: "approve", note: null }
 */
export function parseBulkReview(body: unknown): BulkReviewInput {
  const source = readObject(body);
  const action = parseAction(source.action);
  return { ids: parseIds(source.ids), action, note: parseNote(source.note, action) };
}
