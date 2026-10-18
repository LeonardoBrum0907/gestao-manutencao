import { MEMBER_ROLES, type MatrixCategory, type MemberRoleName } from "@manutencao/shared";

export type SeedRole = { name: MemberRoleName; matrixCategory: MatrixCategory | null };

// Num banco novo, Mecânico e Eletricista já nascem na categoria da matriz delas.
const SEED_CATEGORY: Partial<Record<MemberRoleName, MatrixCategory>> = { mecânico: "mechanical", eletricista: "electrical" };

/**
 * As funções do SIGEM que a API cria ao subir: só num banco sem nenhuma função.
 * Antes ela recriava pelo nome exato a cada boot, e quem renomeava "mecânico" para "Mecânico" ficava com as duas.
 * @example rolesToSeed(0).length // 6
 * @example rolesToSeed(8) // []
 */
export function rolesToSeed(existingCount: number): SeedRole[] {
  if (existingCount > 0) return [];
  return MEMBER_ROLES.map((name) => ({ name, matrixCategory: SEED_CATEGORY[name] ?? null }));
}

const SEED_ORDER = new Map<string, number>(MEMBER_ROLES.map((name, index) => [name, index]));

/**
 * Ordem da lista de funções: as do SIGEM primeiro, na ordem delas (sem ligar para maiúscula), depois as outras por nome.
 * @example ["Caldeireiro", "Eletricista", "Mecânico"].sort(compareRoleNames) // ["Mecânico", "Eletricista", "Caldeireiro"]
 */
export function compareRoleNames(a: string, b: string): number {
  const rank = (name: string) => SEED_ORDER.get(name.toLocaleLowerCase("pt-BR")) ?? SEED_ORDER.size;
  return rank(a) - rank(b) || a.localeCompare(b, "pt-BR");
}
