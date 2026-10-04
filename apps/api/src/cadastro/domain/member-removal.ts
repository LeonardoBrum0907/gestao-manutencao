import { DomainError } from "../../kernel/domain-error";

export function assertMemberCanBeRemoved(recordCount: number): void {
  if (recordCount > 0) {
    throw new DomainError(
      "member_in_use",
      409,
      "Não dá para excluir quem já aparece em registros. Mude o status para Inativo.",
    );
  }
}
