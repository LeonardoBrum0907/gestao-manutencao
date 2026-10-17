import type { MatrixCatalogDto, MatrixSkillDto } from "./competency-matrix";

// Categoria da habilidade na matriz: separa o que é de mecânico do que é de eletricista.
// O colaborador recebe a categoria pela função dele (Configurações › Avaliação › Matriz por função).
export const MATRIX_CATEGORIES = ["mechanical", "electrical"] as const;
export type MatrixCategory = (typeof MATRIX_CATEGORIES)[number];

export const MATRIX_CATEGORY_LABELS: Record<MatrixCategory, string> = {
  mechanical: "Mecânico",
  electrical: "Eletricista",
};

// As 222 habilidades do SIGEM são do check list mecânico; habilidade sem categoria gravada (API antiga) também.
export const DEFAULT_MATRIX_CATEGORY: MatrixCategory = "mechanical";

/**
 * Título da matriz do colaborador, no formato do check list do SIGEM.
 * @example competencyMatrixTitle("mechanical") // "Check List de Conhecimento Específico Mecânico por Equipamento"
 */
export function competencyMatrixTitle(category: MatrixCategory | null): string {
  const subject = category ? MATRIX_CATEGORY_LABELS[category] : "Mecânico e Eletricista";
  return `Check List de Conhecimento Específico ${subject} por Equipamento`;
}

export function isMatrixCategory(value: unknown): value is MatrixCategory {
  return typeof value === "string" && (MATRIX_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Se a habilidade entra na matriz de quem tem esta categoria. Sem categoria (null) a pessoa vê as duas.
 * @example skillFitsCategory({ category: "electrical" }, "mechanical") // false
 */
export function skillFitsCategory(skill: Pick<MatrixSkillDto, "category">, category: MatrixCategory | null): boolean {
  return category === null || skill.category === category;
}

/**
 * O catálogo só com as habilidades da categoria; os equipamentos ficam todos.
 * @example catalogForCategory(catalog, "electrical").skills.every((skill) => skill.category === "electrical") // true
 */
export function catalogForCategory(catalog: MatrixCatalogDto, category: MatrixCategory | null): MatrixCatalogDto {
  if (category === null) return catalog;
  return { ...catalog, skills: catalog.skills.filter((skill) => skillFitsCategory(skill, category)) };
}
