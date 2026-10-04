import type { MemberPosition } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

export function assertTeamNameAvailable(ownerId: string | null, currentId: string | null): void {
  if (ownerId && ownerId !== currentId) {
    throw new DomainError("team_name_taken", 409, "Já existe uma equipe com esse nome.");
  }
}

export function assertCanLead(position: MemberPosition): void {
  if (position !== "supervisor") {
    throw new DomainError("not_supervisor", 400, "O supervisor da equipe precisa ter o cargo Supervisor.");
  }
}

export function assertTeamCanBeRemoved(memberCount: number): void {
  if (memberCount > 0) {
    throw new DomainError(
      "team_in_use",
      409,
      "Não dá para excluir a equipe enquanto houver colaborador nela. Tire ou mova as pessoas antes.",
    );
  }
}
