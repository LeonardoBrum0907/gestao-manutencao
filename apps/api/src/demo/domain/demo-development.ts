import {
  BEHAVIOR_RATINGS,
  PERFORMANCE_SCORES,
  PRODUCTIVITY_LEVELS,
  type BehaviorRating,
  type PdiItemStatus,
  type PerformanceScore,
  type ProductivityLevel,
} from "@manutencao/shared";
import type { DemoRandom } from "./demo-random";

// Avaliação, comportamento e PDI dos técnicos da demonstração, melhores com o grau (Júnior a
// Especialista). A matriz de competências tem o cenário próprio em demo-matrix.ts.

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
 * PDI de seis técnicos: linhas em que é padrinho ou está aprendendo e as ações combinadas.
 * @example DEMO_PDIS[2].items[0].title // "Acompanhar a troca da Peça 1 no Subconjunto 2"
 */
export const DEMO_PDIS: readonly DemoPdi[] = [
  // As referências da matriz (demo-matrix.ts) são os padrinhos das linhas dos seus equipamentos.
  { member: "c3", sponsor: ["l1", "l4"], development: [], items: [] },
  { member: "c8", sponsor: ["l3", "l5"], development: [], items: [] },
  {
    member: "c1", sponsor: [], development: ["l2"], items: [
      { title: "Acompanhar a troca da Peça 1 no Subconjunto 2", skill: { model: "a", index: 6 }, competencyIndex: null, line: "l2", responsible: "c3", dueInDays: 20, status: "in_progress" },
      { title: "Apresentar a análise do RP 0003 para o turno", skill: null, competencyIndex: 11, line: null, responsible: "s1", dueInDays: 35, status: "planned" },
    ],
  },
  {
    member: "c5", sponsor: [], development: ["l3"], items: [
      { title: "Fazer a troca de formato do Equipamento C com o padrinho", skill: { model: "c", index: 0 }, competencyIndex: null, line: "l3", responsible: "c7", dueInDays: 15, status: "planned" },
      { title: "Curso de leitura de diagrama elétrico", skill: { model: "a", index: 18 }, competencyIndex: 3, line: null, responsible: null, dueInDays: -10, status: "done" },
    ],
  },
  {
    member: "c10", sponsor: [], development: ["l4"], items: [
      { title: "Registrar as horas em todos os atendimentos", skill: null, competencyIndex: 6, line: null, responsible: "s3", dueInDays: 30, status: "in_progress" },
    ],
  },
  {
    member: "c6", sponsor: [], development: ["l5"], items: [
      { title: "Treinar o diagnóstico do painel do Equipamento B", skill: { model: "b", index: 18 }, competencyIndex: null, line: "l5", responsible: "c8", dueInDays: 45, status: "planned" },
    ],
  },
];
