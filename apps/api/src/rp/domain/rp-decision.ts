// Situação de um RP da página pública, gravada nas colunas do próprio RP. Só as chaves presentes mudam:
// quem chama manda o que quer trocar e o resto fica como está.
export type RpDecisionPatch = Partial<{
  checkedAt: Date | null;
  reviewRequest: string | null;
  reviewRequestedAt: Date | null;
}>;
