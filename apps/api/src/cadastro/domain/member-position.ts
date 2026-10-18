import { isMemberPosition, type MemberPosition } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

export function requirePosition(value: string): MemberPosition {
  if (!isMemberPosition(value)) {
    throw new DomainError("invalid", 400, `Cargo inválido: ${JSON.stringify(value)}. Use technician ou supervisor.`);
  }
  return value;
}

/**
 * O cargo sai da função: quem tem uma função que lidera equipe é supervisor, o resto é técnico.
 * O cadastro não pede mais o cargo; ele continua gravado porque matriz, desempenho e equipes leem dele.
 * @example positionOfRole({ leadsTeams: true }) // "supervisor"
 */
export function positionOfRole(role: { leadsTeams: boolean }): MemberPosition {
  return role.leadsTeams ? "supervisor" : "technician";
}

export function assertMemberShape(input: { position: MemberPosition; roleId: string | null; teamId: string | null }): void {
  if (!input.roleId) {
    throw new DomainError("invalid", 400, "Escolha a função.");
  }
  if (input.position === "supervisor" && input.teamId) {
    assertCanJoinTeam(input.position);
  }
}

export function assertCanJoinTeam(position: MemberPosition): void {
  if (position === "supervisor") {
    throw new DomainError(
      "supervisor_not_member",
      400,
      "Supervisor lidera a equipe, não entra nela como membro. Escolha-o como supervisor da equipe.",
    );
  }
}

export function assertPositionChange(current: MemberPosition, next: MemberPosition, ledTeamCount: number): void {
  if (current === "supervisor" && next !== "supervisor" && ledTeamCount > 0) {
    throw new DomainError(
      "supervisor_leads_team",
      409,
      `Este colaborador é supervisor de ${ledTeamCount} equipe(s). Troque o supervisor da equipe antes de dar a ele uma função que não lidera equipe.`,
    );
  }
}
