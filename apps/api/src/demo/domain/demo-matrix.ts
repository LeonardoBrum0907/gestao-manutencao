import type { CompetencyLevel, MatrixCategory } from "@manutencao/shared";
import type { DemoSkill } from "./demo-catalog";

// Cenário da matriz de competências da demonstração: cada técnico tem um papel (referência, sólido,
// perto do corte, em desenvolvimento) e uma aderência-alvo por modelo, para a Matriz da equipe contar
// uma história parecida com a de uma fábrica de verdade em vez de notas sorteadas:
// - referências: Colaborador 3 (mecânica A e B) e Colaborador 8 (elétrica A, B e C);
// - ponto fraco: Equipamento C, abaixo da meta, e um dos eletricistas qualificados nele está de férias;
// - 3º turno sem ninguém no Equipamento A; perto do corte: Colaboradores 2, 10 e 11;
// - júniores em desenvolvimento: Colaboradores 5 e 9.

/** Aderência que qualifica, a mesma da produção (Configurações › Matriz). */
export const DEMO_QUALIFIED_ADHERENCE = 60;

/** Esperado por dificuldade de cada grau, na ordem do cadastro de partida (Júnior a Especialista). */
export const DEMO_GRADE_EXPECTED: readonly Readonly<Record<CompetencyLevel, number>>[] = [
  { basic: 2, intermediate: 2, advanced: 2 },
  { basic: 3, intermediate: 3, advanced: 2 },
  { basic: 4, intermediate: 3, advanced: 3 },
  { basic: 4, intermediate: 4, advanced: 4 },
];

// O subconjunto em que a equipe toda é mais fraca, por categoria: as notas abaixo do esperado caem nele primeiro.
const WEAK_SUBGROUP: Readonly<Record<MatrixCategory, string>> = {
  mechanical: "Subconjunto 3 · Selagem",
  electrical: "Subconjunto 4 · Painel elétrico",
};
const LEVEL_RANK: Readonly<Record<CompetencyLevel, number>> = { basic: 0, intermediate: 1, advanced: 2 };

export type DemoMatrixProfile = {
  member: string;
  // Referência: acima do esperado com frequência e, quando falha, só um ponto abaixo.
  strong: boolean;
  // Modelo → aderência-alvo em %.
  targets: Readonly<Record<string, number>>;
};

export const DEMO_MATRIX_PROFILES: readonly DemoMatrixProfile[] = [
  { member: "c1", strong: false, targets: { a: 67, b: 42 } },
  { member: "c2", strong: false, targets: { a: 75, b: 50 } },
  { member: "c3", strong: true, targets: { a: 92, b: 92 } },
  { member: "c4", strong: true, targets: { a: 88, b: 75 } },
  { member: "c5", strong: false, targets: { a: 42, c: 25 } },
  { member: "c6", strong: false, targets: { a: 63, c: 38 } },
  { member: "c7", strong: true, targets: { a: 75, c: 83 } },
  { member: "c8", strong: true, targets: { a: 88, b: 88, c: 88 } },
  { member: "c9", strong: false, targets: { b: 33, c: 17 } },
  { member: "c10", strong: false, targets: { b: 50, c: 38 } },
  { member: "c11", strong: true, targets: { b: 83, c: 58 } },
  { member: "c12", strong: true, targets: { b: 88, c: 75 } },
];

export type DemoScoreInput = {
  skills: readonly DemoSkill[];
  category: MatrixCategory;
  expected: Readonly<Record<CompetencyLevel, number>>;
  target: number;
  strong: boolean;
  // Diferencia as pessoas: com o mesmo alvo, cada uma falha em habilidades diferentes.
  salt: string;
};

/**
 * Notas de um técnico num modelo, na ordem de `skills` (null nas habilidades da outra categoria).
 * Acerta o alvo: as primeiras habilidades da fila (básicas, fora do subconjunto fraco) ficam no esperado ou acima.
 * @example demoMatrixScores({ skills: demoSkills(), category: "electrical", expected: DEMO_GRADE_EXPECTED[1], target: 50, strong: false, salt: "c2|b" })
 */
export function demoMatrixScores(input: DemoScoreInput): (number | null)[] {
  const queue = input.skills
    .map((skill, index) => ({ skill, index }))
    .filter(({ skill }) => skill.category === input.category)
    .sort((left, right) => queueRank(left.skill, input) - queueRank(right.skill, input));
  const meeting = Math.round((input.target / 100) * queue.length);
  const scores: (number | null)[] = input.skills.map(() => null);
  queue.forEach(({ skill, index }, position) => {
    scores[index] = position < meeting ? scoreMeeting(skill, input) : scoreBelow(skill, input);
  });
  return scores;
}

// Quanto maior, mais para o fim da fila (mais chance de ficar abaixo do esperado).
function queueRank(skill: DemoSkill, input: DemoScoreInput): number {
  const weak = skill.subgroup === WEAK_SUBGROUP[input.category] ? 1.5 : 0;
  return LEVEL_RANK[skill.level] + weak + demoJitter(`${input.salt}|${skill.text}|fila`) * 1.2;
}

function scoreMeeting(skill: DemoSkill, input: DemoScoreInput): number {
  const chanceAbove = input.strong ? 0.55 : 0.2;
  const above = demoJitter(`${input.salt}|${skill.text}|acima`) < chanceAbove ? 1 : 0;
  return Math.min(4, input.expected[skill.level] + above);
}

function scoreBelow(skill: DemoSkill, input: DemoScoreInput): number {
  const gap = input.strong || demoJitter(`${input.salt}|${skill.text}|abaixo`) >= 0.3 ? 1 : 2;
  return Math.max(0, input.expected[skill.level] - gap);
}

/**
 * Número entre 0 e 1 tirado do texto (FNV-1a): o mesmo texto dá sempre o mesmo número, sem depender da ordem da carga.
 * @example demoJitter("c1|a") === demoJitter("c1|a") // true
 */
export function demoJitter(text: string): number {
  let hash = 0x811c9dc5;
  for (const char of text) hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), 0x01000193) >>> 0;
  return hash / 4294967296;
}

/**
 * Aderência em % de notas contra o esperado, como a matriz calcula (só as habilidades com nota contam).
 * @example demoAdherence([3, null, 1], demoSkills().slice(0, 3), DEMO_GRADE_EXPECTED[1]) // 50
 */
export function demoAdherence(scores: readonly (number | null)[], skills: readonly DemoSkill[], expected: Readonly<Record<CompetencyLevel, number>>): number {
  let scored = 0;
  let meeting = 0;
  skills.forEach((skill, index) => {
    const score = scores.at(index);
    if (score === null || score === undefined) return;
    scored += 1;
    if (score >= expected[skill.level]) meeting += 1;
  });
  return scored === 0 ? 0 : Math.round((meeting / scored) * 100);
}
