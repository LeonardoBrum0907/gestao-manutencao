import type { MemberDto, RpSupervisorLinkDto } from "@manutencao/shared";

/**
 * Quem pode ganhar um link de supervisor: colaborador com função que lidera equipe, que não está desligado
 * e ainda não tem link (um por supervisor; para outro código existe Trocar link).
 * @example supervisorChoices(members, links).map((member) => member.name) // ["Anderson", "Luiz"]
 */
export function supervisorChoices(members: readonly MemberDto[], links: readonly RpSupervisorLinkDto[]): MemberDto[] {
  const linked = new Set(links.map((link) => link.memberId));
  return members
    .filter((member) => member.position === "supervisor" && member.status !== "inactive" && !linked.has(member.id))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
