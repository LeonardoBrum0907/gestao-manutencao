import {
  TRANSFER_MASTERY_SCORE,
  type MatrixCatalogDto,
  type MatrixSkillDto,
  type TransferEquipmentDto,
  type TransferGapDto,
  type TransferProgressDto,
} from "@manutencao/shared";

// Repasse medido só pela matriz: das habilidades que quem ensina domina, quantas quem aprende já faz.
// Nada de grau ou esperado aqui (pedido do Léo em 2026-10-12: repasse não tem relação com promoção).

/** Nota de uma habilidade na matriz de alguém. */
export type ScoreState = { score: number | null; notApplicable: boolean };

/** Notas de uma pessoa por habilidade (skillId). */
export type ScoreBook = ReadonlyMap<string, ScoreState>;

const NEAR_SCORE = TRANSFER_MASTERY_SCORE - 1;

/**
 * Faz a habilidade: nota 3 ou 4 e não marcada como N/A.
 * @example doesSkill({ score: 3, notApplicable: false }) // true
 */
export function doesSkill(state: ScoreState | undefined): boolean {
  if (!state || state.notApplicable || state.score === null) return false;
  return state.score >= TRANSFER_MASTERY_SCORE;
}

/**
 * Habilidades ativas dos equipamentos em foco que quem ensina domina, na ordem do catálogo.
 * @example masteredSkills(catalog, ["e1"], teacherBook).length // 46
 */
export function masteredSkills(catalog: MatrixCatalogDto, equipmentIds: readonly string[], teacher: ScoreBook): MatrixSkillDto[] {
  const activeFocus = new Set(catalog.equipments.filter((item) => !item.archived && equipmentIds.includes(item.id)).map((item) => item.id));
  return catalog.skills.filter((skill) => !skill.archived && activeFocus.has(skill.equipmentId) && doesSkill(teacher.get(skill.id)));
}

/**
 * Percentual arredondado; nulo quando não há base.
 * @example percentOf(26, 46) // 57
 */
export function percentOf(part: number, total: number): number | null {
  if (total === 0) return null;
  return Math.round((part * 100) / total);
}

/**
 * Quanto quem aprende já faz do que quem ensina domina. Nota 2 conta como perto; 0, 1, N/A ou sem nota, do zero.
 * @example progressOf(mastered, learnerBook) // { mastered: 46, done: 26, near: 12, fromZero: 8, percent: 57 }
 */
export function progressOf(mastered: readonly MatrixSkillDto[], learner: ScoreBook): TransferProgressDto {
  let done = 0;
  let near = 0;
  for (const skill of mastered) {
    const state = learner.get(skill.id);
    if (doesSkill(state)) done += 1;
    else if (!state?.notApplicable && state?.score === NEAR_SCORE) near += 1;
  }
  const fromZero = mastered.length - done - near;
  return { mastered: mastered.length, done, near, fromZero, percent: percentOf(done, mastered.length) };
}

/**
 * Repassado por equipamento, na ordem do catálogo, só onde quem ensina domina alguma coisa.
 * @example byEquipment(catalog, mastered, learnerBook) // [{ equipmentId: "e1", name: "Blistadeira", mastered: 20, done: 12 }]
 */
export function byEquipment(catalog: MatrixCatalogDto, mastered: readonly MatrixSkillDto[], learner: ScoreBook): TransferEquipmentDto[] {
  return catalog.equipments
    .map((equipment) => {
      const skills = mastered.filter((skill) => skill.equipmentId === equipment.id);
      const done = skills.filter((skill) => doesSkill(learner.get(skill.id))).length;
      return { equipmentId: equipment.id, name: equipment.name, mastered: skills.length, done };
    })
    .filter((row) => row.mastered > 0);
}

/** Notas e itens de PDI usados para montar a lista do que falta repassar. */
export type GapSources = { teacher: ScoreBook; learner: ScoreBook; openPdiBySkill: ReadonlyMap<string, string> };

function learnerScoreOf(state: ScoreState | undefined): number | null {
  if (!state || state.notApplicable) return null;
  return state.score;
}

/**
 * O que falta repassar: habilidades que quem ensina domina e quem aprende ainda não faz, na ordem do catálogo.
 * @example gapsOf(catalog, mastered, { teacher, learner, openPdiBySkill: new Map() })[0].learnerScore // 2
 */
export function gapsOf(catalog: MatrixCatalogDto, mastered: readonly MatrixSkillDto[], sources: GapSources): TransferGapDto[] {
  const names = new Map(catalog.equipments.map((equipment) => [equipment.id, equipment.name]));
  return mastered
    .filter((skill) => !doesSkill(sources.learner.get(skill.id)))
    .map((skill) => ({
      skillId: skill.id,
      equipmentName: names.get(skill.equipmentId) ?? "",
      subgroup: skill.subgroup,
      text: skill.text,
      learnerScore: learnerScoreOf(sources.learner.get(skill.id)),
      teacherScore: sources.teacher.get(skill.id)?.score ?? TRANSFER_MASTERY_SCORE,
      openPdiItemId: sources.openPdiBySkill.get(skill.id) ?? null,
    }));
}
