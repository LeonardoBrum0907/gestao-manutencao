import { DomainError } from "../../kernel/domain-error";

export function assertGradeCanBeRemoved(memberCount: number): void {
  if (memberCount > 0) {
    throw new DomainError(
      "grade_in_use",
      409,
      "Não dá para excluir o grau enquanto houver colaborador com ele.",
    );
  }
}
