import type { RpBulkAction, RpPublicDecision } from "@manutencao/shared";

// Textos da avaliação em lote na página pública: o que cada ação pede e o aviso depois de gravar.

const DONE_WORDS: Record<RpBulkAction, [string, string]> = {
  approve: ["aprovado", "aprovados"],
  reject: ["recusado", "recusados"],
  request_review: ["com revisão pedida", "com revisão pedida"],
};

/**
 * Aviso depois de aplicar a ação, no singular ou no plural.
 * @example bulkDoneText("approve", 3) // "3 RPs aprovados."
 */
export function bulkDoneText(action: RpBulkAction, count: number): string {
  const [one, many] = DONE_WORDS[action];
  return count === 1 ? `1 RP ${one}.` : `${count} RPs ${many}.`;
}

export type NotePrompt = { title: string; label: string; placeholder: string; confirm: string; required: boolean };

// Recusar e pedir revisão abrem uma caixa de texto; aprovar grava direto.
export const NOTE_PROMPTS: Record<Exclude<RpBulkAction, "approve">, NotePrompt> = {
  reject: {
    title: "Recusar RPs",
    label: "Motivo da recusa (opcional)",
    placeholder: "Ex.: não é falha de manutenção; RP repetido",
    confirm: "Recusar",
    required: false,
  },
  request_review: {
    title: "Pedir revisão",
    label: "O que precisa revisar?",
    placeholder: "Ex.: faltou a causa raiz; confirme a TAG",
    confirm: "Pedir revisão",
    required: true,
  },
};

/**
 * Classe do selo da situação. Pendente não tem selo: é o normal de um RP novo.
 * @example decisionBadgeClass("rejected") // "… bg-danger-soft text-danger"
 */
export function decisionBadgeClass(decision: RpPublicDecision): string | null {
  const base = "rounded-control px-2 py-1 text-xs font-semibold";
  if (decision === "approved") return `${base} bg-accent-soft text-accent-ink`;
  if (decision === "rejected") return `${base} bg-danger-soft text-danger`;
  if (decision === "revision") return `${base} bg-warn-soft text-warn`;
  return null;
}
