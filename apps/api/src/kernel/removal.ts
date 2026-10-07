import type { RemovalCheckDto } from "@manutencao/shared";
import { DomainError } from "./domain-error";

// Roda as mesmas regras da exclusão sem excluir: o 409 que ela daria vira o motivo, para a tela avisar antes.
export async function removalCheck(check: () => Promise<void>): Promise<RemovalCheckDto> {
  try {
    await check();
    return { canRemove: true, reason: null };
  } catch (error) {
    if (error instanceof DomainError && error.statusCode === 409) return { canRemove: false, reason: error.message };
    throw error;
  }
}
