import { isMemberPosition, type MemberPosition } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

export function requirePosition(value: string): MemberPosition {
  if (!isMemberPosition(value)) {
    throw new DomainError("invalid", 400, "Cargo inválido.");
  }
  return value;
}

export function assertMemberShape(input: { position: MemberPosition; roleId: string | null; teamId: string | null }): void {
  if (input.position === "technician" && !input.roleId) {
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
      "Este colaborador é supervisor de equipe. Troque o supervisor da equipe antes de mudar o cargo.",
    );
  }
}
