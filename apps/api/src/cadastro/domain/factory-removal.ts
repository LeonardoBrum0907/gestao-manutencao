import { DomainError } from "../../kernel/domain-error";

export function assertFactoryCanBeRemoved(machineCount: number): void {
  if (machineCount > 0) {
    throw new DomainError(
      "factory_has_machines",
      409,
      "Não dá para excluir a fábrica enquanto houver máquina nela.",
    );
  }
}
