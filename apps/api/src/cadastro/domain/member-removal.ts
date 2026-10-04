import { DomainError } from "../../kernel/domain-error";

export function assertMemberCanBeRemoved(recordCount: number, ledTeamCount: number): void {
  if (ledTeamCount > 0) {
    throw new DomainError(
      "supervisor_leads_team",
      409,
      "Não dá para excluir quem é supervisor de equipe. Troque o supervisor da equipe antes.",
    );
  }
  if (recordCount > 0) {
    throw new DomainError(
      "member_in_use",
      409,
      "Não dá para excluir quem já aparece em registros. Mude o status para Inativo.",
    );
  }
}
