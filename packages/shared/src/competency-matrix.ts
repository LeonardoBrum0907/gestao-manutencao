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
