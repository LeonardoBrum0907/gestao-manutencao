// Histórico das notas da matriz: a MemberSkill só guarda a nota atual, e o repasse entre técnicos precisa saber
// quando cada nota mudou para desenhar a evolução e achar repasses parados.

/** Nota de uma habilidade como ela fica guardada no histórico. Sem nota e sem N/A = linha apagada. */
export type SkillState = { skillId: string; score: number | null; notApplicable: boolean };

const EMPTY = { score: null, notApplicable: false } as const;

function sameState(a: Omit<SkillState, "skillId">, b: Omit<SkillState, "skillId">): boolean {
  return a.score === b.score && a.notApplicable === b.notApplicable;
}

/**
 * Das notas novas, só as que mudaram de verdade em relação às atuais. Mudar só o "esp." não entra:
 * o histórico conta o que a pessoa faz, não o que se espera dela.
 * @example changedSkills([{ skillId: "s1", score: 2, notApplicable: false }], [{ skillId: "s1", score: 3, notApplicable: false }])
 * // [{ skillId: "s1", score: 3, notApplicable: false }]
 */
export function changedSkills(previous: readonly SkillState[], next: readonly SkillState[]): SkillState[] {
  const before = new Map(previous.map((state) => [state.skillId, state]));
  return next.filter((state) => !sameState(before.get(state.skillId) ?? EMPTY, state));
}

/**
 * Estados novos de uma gravação: as notas salvas e, para as apagadas, sem nota.
 * @example nextStates([{ skillId: "s1", score: 3, notApplicable: false }], ["s2"]).length // 2
 */
export function nextStates(saved: readonly SkillState[], cleared: readonly string[]): SkillState[] {
  const kept = saved.map(({ skillId, score, notApplicable }) => ({ skillId, score, notApplicable }));
  return [...kept, ...cleared.map((skillId) => ({ skillId, ...EMPTY }))];
}
