import { DomainError } from "../../kernel/domain-error";

export function assertGradeCanBeRemoved(technicianCount: number): void {
  if (technicianCount > 0) {
    throw new DomainError(
      "grade_in_use",
      409,
      "Não dá para excluir o grau enquanto houver técnico com ele.",
    );
  }
}
