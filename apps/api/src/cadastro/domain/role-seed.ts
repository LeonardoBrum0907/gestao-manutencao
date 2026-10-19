import { MEMBER_ROLES, type MatrixCategory, type MemberRoleName } from "@manutencao/shared";

export type SeedRole = { name: string; matrixCategory: MatrixCategory | null; leadsTeams: boolean };
export type ExistingRole = Pick<SeedRole, "leadsTeams">;

// Num banco novo, Mecânico e Eletricista já nascem na categoria da matriz delas.
const SEED_CATEGORY: Partial<Record<MemberRoleName, MatrixCategory>> = { mecânico: "mechanical", eletricista: "electrical" };

/**
 * As funções do SIGEM que a API cria ao subir: só num banco sem nenhuma função de quem é liderado.
 * Antes ela recriava pelo nome exato a cada boot, e quem renomeava "mecânico" para "Mecânico" ficava com as duas.
 * A migração 20261018200000_role_leads_teams cria o Supervisor antes do primeiro boot (PR #118): num banco novo
 * ele é a única função, e contar qualquer função deixava o banco só com ele.
 * @example rolesToSeed([]).length // 7: as seis do SIGEM e Supervisor
 * @example rolesToSeed([{ leadsTeams: true }]).length // 6: o Supervisor já existe
 * @example rolesToSeed([{ leadsTeams: false }]) // []
 */
export function rolesToSeed(existing: ExistingRole[]): SeedRole[] {
  if (existing.some((role) => !role.leadsTeams)) return [];
  const sigem = MEMBER_ROLES.map((name) => ({ name, matrixCategory: SEED_CATEGORY[name] ?? null, leadsTeams: false }));
  if (existing.length) return sigem;
  // Sem cargo no cadastro, o supervisor é quem tem uma função que lidera equipe.
  return [...sigem, { name: "Supervisor", matrixCategory: null, leadsTeams: true }];
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
