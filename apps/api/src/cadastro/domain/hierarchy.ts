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

export type MachineSpot = { lineId: string | null; machineId: string | null; subassemblyId: string | null };
export type MachineSpotRefs = {
  machine: { lineId: string; equipmentId: string | null } | null;
  subassembly: { id: string; equipmentId: string; archived: boolean } | null;
};

/**
 * Máquina e subconjunto escolhidos numa ficha (problema, RP) batem com o cadastro: a máquina é da linha
 * e o subconjunto é do modelo dela. Os dois são opcionais, mas subconjunto pede máquina e máquina pede linha.
 * Ex.: `assertMachineSpot({ lineId: "l1", machineId: "m1", subassemblyId: null }, await refs.machineSpot("m1", null), null)`
 */
export function assertMachineSpot(spot: MachineSpot, refs: MachineSpotRefs, savedSubassemblyId: string | null): void {
  if (spot.subassemblyId && !spot.machineId) throw new DomainError("machine", 400, "Escolha a máquina do subconjunto.");
  if (!spot.machineId) return;
  if (!spot.lineId) throw new DomainError("machine", 400, "Escolha a linha da máquina.");
  if (!refs.machine) throw new DomainError("machine", 400, `Máquina não encontrada (id ${spot.machineId}).`);
  if (refs.machine.lineId !== spot.lineId) throw new DomainError("machine", 400, "Esta máquina não é da linha escolhida.");
  if (!spot.subassemblyId) return;
  if (!refs.subassembly) throw new DomainError("subassembly", 400, `Subconjunto não encontrado (id ${spot.subassemblyId}).`);
  assertSubassemblyFits(refs.machine, refs.subassembly, savedSubassemblyId);
}

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
