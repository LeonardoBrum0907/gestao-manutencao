import { DomainError } from "../../kernel/domain-error";

export function assertMemberCanBeRemoved(recordCount: number, ledTeamCount: number, pdiFileCount: number): void {
  if (ledTeamCount > 0) {
    throw new DomainError(
      "supervisor_leads_team",
      409,
      "Não dá para excluir quem é supervisor de equipe. Troque o supervisor da equipe antes.",
    );
  }
  if (pdiFileCount > 0) {
    throw new DomainError(
      "member_has_files",
      409,
      "Não dá para excluir quem tem anexos no PDI. Remova os anexos ou mude o status para Inativo.",
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
