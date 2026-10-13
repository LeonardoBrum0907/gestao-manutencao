// Repasse rápido pela Matriz da equipe: um clique em quem ensina, outro em quem aprende.
// Clicar numa célula leva o equipamento da coluna como foco; clicar no nome deixa a matriz inteira de quem ensina.

/** Um clique na grade: a pessoa e, se foi numa célula, o equipamento da coluna. */
export type QuickTarget = { memberId: string; equipmentId: string | null };

/** O que a janela "Novo repasse" recebe já preenchido. Foco vazio = matriz inteira de quem ensina. */
export type QuickTransferDraft = { teacherId: string; learnerId: string; equipmentIds: string[] };

/** Depois de um clique: quem ensina escolhido (esperando o segundo clique) ou o rascunho pronto. */
export type QuickStep = { teacher: QuickTarget | null; draft: QuickTransferDraft | null };

/**
 * Foco do repasse: o equipamento clicado em quem ensina e, se não houver, o clicado em quem aprende.
 * Só vale equipamento marcado na matriz de quem ensina (o servidor recusa o resto).
 * @example quickFocus("e1", "e2", ["e2"]) // ["e2"]
 */
export function quickFocus(teacherEquipmentId: string | null, learnerEquipmentId: string | null, teacherEquipmentIds: readonly string[]): string[] {
  const chosen = [teacherEquipmentId, learnerEquipmentId].find((id) => id !== null && teacherEquipmentIds.includes(id));
  return chosen ? [chosen] : [];
}

/**
 * Próximo passo do repasse rápido. Clicar de novo em quem ensina desfaz a escolha.
 * @example nextQuickStep({ memberId: "m1", equipmentId: "e1" }, { memberId: "m2", equipmentId: null }, ["e1"]).draft
 * // { teacherId: "m1", learnerId: "m2", equipmentIds: ["e1"] }
 */
export function nextQuickStep(teacher: QuickTarget | null, target: QuickTarget, teacherEquipmentIds: readonly string[]): QuickStep {
  if (!teacher) return { teacher: target, draft: null };
  if (teacher.memberId === target.memberId) return { teacher: null, draft: null };
  const equipmentIds = quickFocus(teacher.equipmentId, target.equipmentId, teacherEquipmentIds);
  return { teacher: null, draft: { teacherId: teacher.memberId, learnerId: target.memberId, equipmentIds } };
}
