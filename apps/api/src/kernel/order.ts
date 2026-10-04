import { DomainError } from "./domain-error";

// Nova ordem de um cadastro: precisa trazer cada item uma vez, nem mais nem menos.
export function requireOrder(ids: unknown, existing: string[]): string[] {
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    throw new DomainError("invalid", 400, "Ordem inválida.");
  }
  const unique = new Set<string>(ids);
  if (unique.size !== ids.length || ids.length !== existing.length || existing.some((id) => !unique.has(id))) {
    throw new DomainError("invalid", 400, "A ordem precisa ter todos os itens, uma vez cada.");
  }
  return ids;
}
