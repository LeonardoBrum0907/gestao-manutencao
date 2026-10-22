import {
  BEHAVIOR_RATINGS,
  PERFORMANCE_SCORES,
  PRODUCTIVITY_LEVELS,
  type BehaviorRating,
  type ChamadoShift,
  type PdiItemStatus,
  type PerformanceScore,
  type ProductivityLevel,
} from "@manutencao/shared";
import type { DemoRandom } from "./demo-random";

// Matriz, avaliação, comportamento e PDI dos técnicos da demonstração. As notas sobem com o grau
// (Júnior a Especialista) e variam um pouco, para a matriz da equipe ter lacunas e destaques.

const MODELS_BY_SHIFT: Record<ChamadoShift, string[]> = { first: ["a", "b"], second: ["a", "c"], third: ["b", "c"] };
const ALL_MODELS = ["a", "b", "c"];
const SPECIALIST = 3;

/**
 * Modelos em que o técnico trabalha: dois pelo turno; o especialista conhece os três.
 * @example demoModelsOf("second", 1) // ["a", "c"]
 */
export function demoModelsOf(shift: ChamadoShift, gradeIndex: number): string[] {
  return gradeIndex >= SPECIALIST ? ALL_MODELS : MODELS_BY_SHIFT[shift];
}

/**
 * Nota de 0 a 4 numa habilidade, perto do grau (Júnior ~2, Sênior em diante ~4); nulo = ainda não avaliada.
 * @example demoSkillScore(demoRandom(3), 0) // 1, 2 ou 3 (ou null)
 */
export function demoSkillScore(random: DemoRandom, gradeIndex: number): number | null {
  if (random.chance(0.1)) return null;
  return Math.min(4, Math.max(0, gradeIndex + 2 + random.int(-1, 1)));
}

/**
 * Nota da avaliação de desempenho (10, 8, 6, 4 ou 2), melhor com o grau.
 * @example PERFORMANCE_SCORES.includes(demoPerformanceScore(demoRandom(1), 3)) // true
 */
export function demoPerformanceScore(random: DemoRandom, gradeIndex: number): PerformanceScore {
  const best = Math.max(0, 2 - Math.floor(gradeIndex / 2));
  return PERFORMANCE_SCORES[Math.min(PERFORMANCE_SCORES.length - 1, best + random.int(0, 2))];
}

/**
 * Trimestres já avaliados no ano: do primeiro até o atual.
 * @example demoQuarters(new Date("2026-10-22T12:00:00Z")) // [1, 2, 3, 4]
 */
export function demoQuarters(today: Date): number[] {
  return Array.from({ length: Math.floor(today.getUTCMonth() / 3) + 1 }, (_, index) => index + 1);
}

export type DemoBehavior = { punctuality: BehaviorRating; productivity: ProductivityLevel; collaboration: BehaviorRating };

/**
 * Comportamento sorteado, puxado para o lado bom (excelente e bom são os mais comuns).
 * @example BEHAVIOR_RATINGS.includes(demoBehavior(demoRandom(2)).punctuality) // true
 */
export function demoBehavior(random: DemoRandom): DemoBehavior {
  const rating = (): BehaviorRating => BEHAVIOR_RATINGS[Math.min(random.int(0, 3), random.int(0, 3))];
  return { punctuality: rating(), productivity: PRODUCTIVITY_LEVELS[Math.min(random.int(0, 2), random.int(0, 2))], collaboration: rating() };
}

export type DemoPdiItem = {
  title: string;
  // Habilidade pelo modelo e pela posição no catálogo do modelo (demoSkills).
  skill: { model: string; index: number } | null;
  // Competência pela posição no cadastro de partida (Segurança, Trabalho em equipe…).
  competencyIndex: number | null;
  line: string | null;
  responsible: string | null;
  dueInDays: number | null;
  status: PdiItemStatus;
};
export type DemoPdi = { member: string; sponsor: string[]; development: string[]; items: DemoPdiItem[] };

/**
 * PDI de quatro técnicos: linhas em que é padrinho ou está aprendendo e as ações combinadas.
 * @example DEMO_PDIS[0].items[0].title // "Acompanhar a troca da Peça 1 no Subconjunto 2"
 */
export const DEMO_PDIS: readonly DemoPdi[] = [
  {
    member: "c1", sponsor: ["l1"], development: ["l2"], items: [
      { title: "Acompanhar a troca da Peça 1 no Subconjunto 2", skill: { model: "a", index: 4 }, competencyIndex: null, line: "l2", responsible: "c3", dueInDays: 20, status: "in_progress" },
      { title: "Apresentar a análise do RP 0003 para o turno", skill: null, competencyIndex: 11, line: null, responsible: "s1", dueInDays: 35, status: "planned" },
    ],
  },
  {
    member: "c5", sponsor: [], development: ["l3"], items: [
      { title: "Fazer a troca de formato do Equipamento C com o padrinho", skill: { model: "c", index: 0 }, competencyIndex: null, line: "l3", responsible: "c7", dueInDays: 15, status: "planned" },
      { title: "Curso de leitura de diagrama elétrico", skill: { model: "a", index: 11 }, competencyIndex: 3, line: null, responsible: null, dueInDays: -10, status: "done" },
    ],
  },
  {
    member: "c10", sponsor: ["l4"], development: [], items: [
      { title: "Registrar as horas em todos os atendimentos", skill: null, competencyIndex: 6, line: null, responsible: "s3", dueInDays: 30, status: "in_progress" },
    ],
  },
  {
    member: "c6", sponsor: ["l3"], development: ["l5"], items: [
      { title: "Treinar o diagnóstico do painel do Equipamento B", skill: { model: "b", index: 11 }, competencyIndex: null, line: "l5", responsible: "c9", dueInDays: 45, status: "planned" },
    ],
  },
];
