import { DomainError } from "../../kernel/domain-error";

// Linha com máquinas cadastradas não sai: as máquinas ficariam sem linha.
export function assertLineCanBeRemoved(machineCount: number): void {
  if (machineCount > 0) {
    throw new DomainError("line_has_machines", 409, "Não dá para excluir a linha enquanto houver máquina nela.");
  }
}

// Nome do subconjunto é único dentro do modelo, sem diferenciar maiúsculas e acentos.
export function assertSubassemblyNameAvailable(name: string, siblings: { id: string; name: string }[], currentId: string | null): void {
  const wanted = fold(name);
  if (siblings.some((sibling) => sibling.id !== currentId && fold(sibling.name) === wanted)) {
    throw new DomainError("subassembly_name_taken", 409, "Esse modelo já tem um subconjunto com esse nome.");
  }
}

// O subconjunto vem do modelo da máquina. Um subconjunto arquivado só fica se a ficha já apontava para ele.
export function assertSubassemblyFits(
  machine: { equipmentId: string | null },
  subassembly: { id: string; equipmentId: string; archived: boolean },
  currentSubassemblyId: string | null,
): void {
  if (!machine.equipmentId) {
    throw new DomainError("machine_without_model", 400, "Esta máquina não tem modelo de equipamento. Escolha o modelo no cadastro da linha.");
  }
  if (subassembly.equipmentId !== machine.equipmentId) {
    throw new DomainError("subassembly", 400, "Este subconjunto não é do modelo desta máquina.");
  }
  if (subassembly.archived && subassembly.id !== currentSubassemblyId) {
    throw new DomainError("subassembly", 400, "Este subconjunto está arquivado.");
  }
}

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
