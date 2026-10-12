import { DomainError } from "../../kernel/domain-error";
import { foldName } from "./hierarchy";

/**
 * Nome da versão é único dentro do modelo, sem diferenciar maiúsculas e acentos.
 * Ex.: `assertVersionNameAvailable("NMX", [{ id: "v1", name: "M092" }], null)`
 */
export function assertVersionNameAvailable(name: string, siblings: { id: string; name: string }[], currentId: string | null): void {
  const wanted = foldName(name);
  if (siblings.some((sibling) => sibling.id !== currentId && foldName(sibling.name) === wanted)) {
    throw new DomainError("version_name_taken", 409, `Este modelo já tem a versão "${name}".`);
  }
}

/**
 * Versão com máquina ou subconjunto não sai: arquivar tira das listas sem mexer no que já aponta para ela.
 * Ex.: `assertVersionCanBeRemoved({ machines: 0, subassemblies: 2 })` // recusa
 */
export function assertVersionCanBeRemoved(usage: { machines: number; subassemblies: number }): void {
  if (usage.machines > 0) {
    throw new DomainError("version_in_use", 409, `Há ${usage.machines === 1 ? "1 máquina" : `${usage.machines} máquinas`} nesta versão. Arquive em vez de excluir.`);
  }
  if (usage.subassemblies > 0) {
    throw new DomainError("version_in_use", 409, "Esta versão tem subconjuntos próprios. Arquive em vez de excluir.");
  }
}
