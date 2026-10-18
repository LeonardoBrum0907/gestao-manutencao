import { RP_PUBLIC_DECISION_LABELS, type RpBulkAction, type RpPublicDecision, type RpStatus } from "@manutencao/shared";
import { rpStatusLabel } from "../../rp/model/rp";

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
 * Classe do selo da avaliação do supervisor. Pendente fica neutro.
 * @example decisionBadgeClass("rejected") // "… bg-danger-soft text-danger"
 */
export function decisionBadgeClass(decision: RpPublicDecision): string {
  const base = "rounded-control px-2 py-1 text-xs font-semibold";
  if (decision === "approved") return `${base} bg-accent-soft text-accent-ink`;
  if (decision === "rejected") return `${base} bg-danger-soft text-danger`;
  if (decision === "revision") return `${base} bg-warn-soft text-warn`;
  return `${base} bg-chip text-muted`;
}

// Os dois selos ficam lado a lado e "Aprovado" com "Em análise" confundia: cada um diz do que fala (pedido do Léo).

/**
 * Texto do selo da avaliação do supervisor sobre o relatório.
 * @example decisionBadgeText("approved") // "Avaliação do supervisor: Aprovado"
 */
export function decisionBadgeText(decision: RpPublicDecision): string {
  return `Avaliação do supervisor: ${RP_PUBLIC_DECISION_LABELS[decision]}`;
}

/**
 * Texto do selo do status do RP, que diz em que pé está a falha na máquina.
 * @example machineStatusText("analysis") // "Status da máquina: Em análise"
 */
export function machineStatusText(status: RpStatus): string {
  return `Status da máquina: ${rpStatusLabel(status)}`;
}
