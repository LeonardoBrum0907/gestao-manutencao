import { DomainError } from "../../kernel/domain-error";

export function assertFactoryCanBeRemoved(lineCount: number): void {
  if (lineCount > 0) {
    throw new DomainError(
      "factory_has_lines",
      409,
      "Não dá para excluir a fábrica enquanto houver linha nela.",
    );
  }
}
