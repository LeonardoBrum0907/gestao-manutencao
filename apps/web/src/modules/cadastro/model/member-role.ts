import type { MemberPosition, MemberRoleDto } from "@manutencao/shared";

/**
 * O cargo que a função escolhida dá: quem tem uma função que lidera equipe é supervisor.
 * Sem função escolhida, fica o cargo que já estava. A API faz a mesma conta e ignora o que a tela mandar.
 * @example positionForRole({ leadsTeams: true }, "technician") // "supervisor"
 */
export function positionForRole(role: Pick<MemberRoleDto, "leadsTeams"> | undefined, current: MemberPosition): MemberPosition {
  if (!role) return current;
  return role.leadsTeams ? "supervisor" : "technician";
}

/**
 * O que a lista de Funções mostra ao lado do nome: se lidera equipe e quantos têm a função.
 * @example roleMetaText({ leadsTeams: true }, "2 colaboradores") // "Lidera equipe · 2 colaboradores"
 */
export function roleMetaText(role: Pick<MemberRoleDto, "leadsTeams">, usage: string): string {
  return [role.leadsTeams ? "Lidera equipe" : "", usage].filter(Boolean).join(" · ");
}
