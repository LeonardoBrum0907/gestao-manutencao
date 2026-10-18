import type { RpBulkAction } from "@manutencao/shared";

// Situação de um RP da página pública, gravada nas colunas do próprio RP. Só as chaves presentes mudam:
// quem chama manda o que quer trocar e o resto fica como está.
export type RpDecisionPatch = Partial<{
  checkedAt: Date | null;
  reviewRequest: string | null;
  reviewRequestedAt: Date | null;
  rejectedAt: Date | null;
  rejectionNote: string | null;
}>;

const CLEARED: Required<RpDecisionPatch> = {
  checkedAt: null,
  reviewRequest: null,
  reviewRequestedAt: null,
  rejectedAt: null,
  rejectionNote: null,
};

/**
 * O que gravar quando o supervisor aprova, recusa ou pede revisão. Uma situação apaga as outras, para
 * o RP nunca ficar aprovado e recusado ao mesmo tempo.
 * @example decisionPatch("reject", agora, "Faltou a causa") // { rejectedAt: agora, rejectionNote: "Faltou a causa", checkedAt: null, … }
 */
export function decisionPatch(action: RpBulkAction, at: Date, note: string | null): Required<RpDecisionPatch> {
  if (action === "approve") return { ...CLEARED, checkedAt: at };
  if (action === "reject") return { ...CLEARED, rejectedAt: at, rejectionNote: note };
  return { ...CLEARED, reviewRequest: note, reviewRequestedAt: at };
}
