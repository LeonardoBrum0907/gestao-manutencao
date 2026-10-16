import type { MatrixCategory } from "./matrix-category";
import type { TeamLineDto, TeamMatrixLayoutDto } from "./team-matrix-layout";

// O catálogo (equipamentos e habilidades) é cadastro do coordenador e mora no banco.
// Os 9 equipamentos e as 222 habilidades do SIGEM entram pela migration 20261005120000_matrix_catalog.

export const COMPETENCY_LEVELS = ["basic", "intermediate", "advanced"] as const;
export type CompetencyLevel = (typeof COMPETENCY_LEVELS)[number];

export const COMPETENCY_LEVEL_LABELS: Record<CompetencyLevel, string> = {
  basic: "Básico",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export const COMPETENCY_LEVEL_EXPECTED: Record<CompetencyLevel, number> = {
  basic: 2,
  intermediate: 3,
  advanced: 4,
};

// Esperado que o grau do colaborador define para cada dificuldade; null fica com o padrão da dificuldade.
export type GradeExpectedDto = Record<CompetencyLevel, number | null>;

export const EMPTY_GRADE_EXPECTED: GradeExpectedDto = { basic: null, intermediate: null, advanced: null };

/**
 * Esperado padrão por dificuldade para um colaborador: o do grau dele quando definido, senão o da dificuldade.
 * O "esp." marcado na linha da habilidade continua valendo acima disto.
 * @example expectedByLevel({ basic: null, intermediate: 2, advanced: 1 }) // { basic: 2, intermediate: 2, advanced: 1 }
 */
export function expectedByLevel(grade: GradeExpectedDto | null): Record<CompetencyLevel, number> {
  return {
    basic: grade?.basic ?? COMPETENCY_LEVEL_EXPECTED.basic,
    intermediate: grade?.intermediate ?? COMPETENCY_LEVEL_EXPECTED.intermediate,
    advanced: grade?.advanced ?? COMPETENCY_LEVEL_EXPECTED.advanced,
  };
}

export function isCompetencyLevel(value: string): value is CompetencyLevel {
  return (COMPETENCY_LEVELS as readonly string[]).includes(value);
}

export type MatrixEquipmentDto = {
  id: string;
  name: string;
  archived: boolean;
  // Quantos técnicos qualificados o equipamento precisa ter (0 = sem mínimo definido).
  minQualified: number;
};

export type MatrixSkillDto = {
  id: string;
  equipmentId: string;
  subgroup: string;
  text: string;
  level: CompetencyLevel;
  // De mecânico ou de técnico: cada colaborador vê só a da categoria da função dele.
  category: MatrixCategory;
  archived: boolean;
};

// Na ordem do cadastro: equipamentos pela posição, habilidades pela posição dentro do equipamento.
export type MatrixCatalogDto = {
  equipments: MatrixEquipmentDto[];
  skills: MatrixSkillDto[];
};

// Qualificado no equipamento: aderência da matriz do técnico a partir deste percentual (o coordenador ajusta em Configurações).
export const DEFAULT_QUALIFIED_ADHERENCE = 80;

// Meta das notas de desempenho (10/8/6/4/2): o gráfico por competência marca esta nota.
export const DEFAULT_PERFORMANCE_TARGET = 8;

export type MatrixSettingsDto = {
  qualifiedAdherence: number;
  performanceTarget: number;
};

export type TeamCoverageStatus = "ok" | "single" | "short" | "none";

export type TeamEquipmentDto = {
  id: string;
  name: string;
  minQualified: number;
  qualified: number;
  // Qualificados por turno (só os turnos com técnico no equipamento).
  qualifiedByShift: Record<string, number>;
  // none: ninguém qualificado; short: abaixo do mínimo; single: só um qualificado (ponto único).
  status: TeamCoverageStatus;
};

export type TeamMemberDto = {
  id: string;
  name: string;
  shift: string;
  teamId: string | null;
  // Para agrupar a Matriz da equipe por grau e por equipe; vazio quando o técnico não tem.
  gradeName: string | null;
  teamName: string | null;
  // Itens do PDI em aberto com prazo vencido.
  pdiOverdue: number;
  // Só os equipamentos marcados na matriz do técnico.
  // above/exact/below: habilidades com nota acima, igual e abaixo do esperado.
  cells: { equipmentId: string; adherence: number | null; scored: number; applicable: number; above: number; exact: number; below: number }[];
};

export type TeamMatrixDto = {
  // Aderência mínima para contar como qualificado.
  qualifiedAdherence: number;
  equipments: TeamEquipmentDto[];
  members: TeamMemberDto[];
  // Linhas cadastradas, para as colunas seguirem as linhas e máquinas do cadastro.
  lines: TeamLineDto[];
  layout: TeamMatrixLayoutDto;
};
