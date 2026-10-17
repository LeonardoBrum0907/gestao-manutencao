import type { CompetencyEntryDto, MatrixCatalogDto, MatrixSkillDto } from "@manutencao/shared";
import { normalize } from "./merge";

// Regras das ferramentas da matriz pela IA: a IA manda só o que muda, a tela manda a linha inteira.

export type ScoreChange = {
  skillId: string;
  score?: number | null;
  notApplicable?: boolean;
  expected?: number | null;
};

export type ScoreEntry = { skillId: string; score: number | null; notApplicable: boolean; expected: number | null };

/**
 * Junta a nota que a IA mandou com a que já existe: campo ausente fica, null limpa.
 * Nota nova tira o "não se aplica" e vice-versa, como o clique na tela; os dois juntos seguem para o caso de uso recusar.
 * @example mergeScore({ skillId: "s1", score: 1, notApplicable: false, expected: 3 }, { skillId: "s1", score: 2 })
 * // { skillId: "s1", score: 2, notApplicable: false, expected: 3 }
 */
export function mergeScore(current: CompetencyEntryDto | undefined, change: ScoreChange): ScoreEntry {
  const next: ScoreEntry = {
    skillId: change.skillId,
    score: current?.score ?? null,
    notApplicable: current?.notApplicable ?? false,
    expected: current?.expected ?? null,
  };
  if (change.score !== undefined) next.score = change.score;
  if (change.notApplicable !== undefined) next.notApplicable = change.notApplicable;
  else if (change.score !== undefined && change.score !== null) next.notApplicable = false;
  if (change.notApplicable === true && change.score === undefined) next.score = null;
  if (change.expected !== undefined) next.expected = change.expected;
  return next;
}

/**
 * Equipamentos que o técnico ainda não tem marcados e que ganharam nota ou "não se aplica".
 * Na tela só dá para avaliar equipamento marcado; sem marcar, a nota fica guardada mas fora da matriz.
 * @example equipmentsToMark(["e1"], [{ skillId: "s2", score: 3, ... }], catalog) // ["e2"]
 */
export function equipmentsToMark(marked: readonly string[], entries: readonly ScoreEntry[], catalog: MatrixCatalogDto): string[] {
  const equipmentOf = new Map(catalog.skills.map((skill) => [skill.id, skill.equipmentId]));
  const wanted = entries
    .filter((entry) => entry.score !== null || entry.notApplicable)
    .map((entry) => equipmentOf.get(entry.skillId))
    .filter((equipmentId): equipmentId is string => equipmentId !== undefined && !marked.includes(equipmentId));
  return [...new Set(wanted)];
}

export type SkillDraft = { equipmentId: string; subgroup: string; text: string; category: string };

/**
 * Habilidade já cadastrada no mesmo equipamento, subconjunto e categoria com o mesmo texto (sem ligar para acento e caixa).
 * O mesmo texto em outra categoria é outra linha: a do eletricista não repete a do mecânico.
 * @example findSameSkill(catalog.skills, { equipmentId: "e1", subgroup: "Cabeçote", text: "trocar faca", category: "mechanical" })
 */
export function findSameSkill(skills: readonly MatrixSkillDto[], draft: SkillDraft): MatrixSkillDto | undefined {
  return skills.find(
    (skill) =>
      skill.equipmentId === draft.equipmentId &&
      skill.category === draft.category &&
      normalize(skill.subgroup) === normalize(draft.subgroup) &&
      normalize(skill.text) === normalize(draft.text),
  );
}

/**
 * Usa a grafia de um subconjunto que já existe no equipamento, para "cabecote" não virar um grupo ao lado de "Cabeçote".
 * @example canonicalSubgroup(catalog.skills, "e1", "cabecote") // "Cabeçote"
 */
export function canonicalSubgroup(skills: readonly MatrixSkillDto[], equipmentId: string, subgroup: string): string {
  const wanted = normalize(subgroup);
  const existing = skills.find((skill) => skill.equipmentId === equipmentId && normalize(skill.subgroup) === wanted);
  return existing?.subgroup ?? subgroup.trim();
}
