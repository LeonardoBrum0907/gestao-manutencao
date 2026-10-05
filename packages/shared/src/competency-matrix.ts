export const COMPETENCY_MATRIX_TITLE = "Check List de Conhecimento Específico Mecânico por Equipamento";

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
  archived: boolean;
};

// Na ordem do cadastro: equipamentos pela posição, habilidades pela posição dentro do equipamento.
export type MatrixCatalogDto = {
  equipments: MatrixEquipmentDto[];
  skills: MatrixSkillDto[];
};

// Qualificado no equipamento: aderência da matriz do técnico a partir deste percentual.
export const QUALIFIED_ADHERENCE = 80;

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
  // Itens do PDI em aberto com prazo vencido.
  pdiOverdue: number;
  // Só os equipamentos marcados na matriz do técnico.
  cells: { equipmentId: string; adherence: number | null; scored: number; applicable: number; below: number }[];
};

export type TeamMatrixDto = {
  equipments: TeamEquipmentDto[];
  members: TeamMemberDto[];
};
