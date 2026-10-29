import { scopesOverlap, subassemblyReaches } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

// Linha com máquinas cadastradas não sai: as máquinas ficariam sem linha.
export function assertLineCanBeRemoved(machineCount: number): void {
  if (machineCount > 0) {
    throw new DomainError("line_has_machines", 409, "Não dá para excluir a linha enquanto houver máquina nela.");
  }
}

export type SubassemblySibling = { id: string; name: string; machineId: string | null };
export type SubassemblyPlace = Pick<SubassemblySibling, "machineId">;

/**
 * Nome do subconjunto não repete entre os que aparecem juntos numa máquina, sem diferenciar maiúsculas e acentos.
 * Os "só desta máquina" de máquinas diferentes podem repetir (desde o PR #54, 2026-10-12).
 * Ex.: `assertSubassemblyNameAvailable("Balança", { machineId: "m1" }, irmaos, null)`
 */
export function assertSubassemblyNameAvailable(
  name: string,
  place: SubassemblyPlace,
  siblings: SubassemblySibling[],
  currentId: string | null,
): void {
  const wanted = foldName(name);
  const clash = siblings.some(
    (sibling) => sibling.id !== currentId && foldName(sibling.name) === wanted && scopesOverlap(place, sibling),
  );
  if (clash) {
    throw new DomainError("subassembly_name_taken", 409, `Já existe o subconjunto "${name}" nas mesmas máquinas deste modelo.`);
  }
}

export type SpotMachine = { id: string; equipmentId: string | null; hiddenSubassemblyIds: string[] };
export type SpotSubassembly = { id: string; equipmentId: string; machineId: string | null; archived: boolean };

/**
 * O subconjunto alcança a máquina (é do modelo ou só dela), está ativo e a máquina não o escondeu.
 * O que a ficha já apontava (currentSubassemblyId) fica, mesmo arquivado, escondido ou só de outra máquina; de outro modelo, não.
 * Ex.: `assertSubassemblyFits(maquina, subconjunto, ficha.subassemblyId)`
 */
export function assertSubassemblyFits(machine: SpotMachine, subassembly: SpotSubassembly, currentSubassemblyId: string | null): void {
  if (!machine.equipmentId) {
    throw new DomainError("machine_without_model", 400, "Esta máquina não tem modelo de equipamento. Escolha o modelo no cadastro da máquina.");
  }
  if (subassembly.equipmentId !== machine.equipmentId) {
    throw new DomainError("subassembly", 400, "Este subconjunto não é do modelo desta máquina.");
  }
  if (subassembly.id === currentSubassemblyId) return;
  if (!subassemblyReaches(subassembly, machine)) {
    throw new DomainError("subassembly", 400, "Este subconjunto é só de outra máquina.");
  }
  if (subassembly.archived) throw new DomainError("subassembly", 400, "Este subconjunto está arquivado.");
  if (machine.hiddenSubassemblyIds.includes(subassembly.id)) {
    throw new DomainError("subassembly", 400, "Esta máquina não tem este subconjunto (está desmarcado na tela da máquina).");
  }
}

export type MachineSpot = { lineId: string | null; machineId: string | null; subassemblyId: string | null };
export type MachineSpotRefs = {
  machine: (SpotMachine & { lineId: string }) | null;
  subassembly: SpotSubassembly | null;
};

/**
 * Máquina e subconjunto escolhidos numa ficha (problema, RP) batem com o cadastro: a máquina é da linha
 * e o subconjunto é dela. Os dois são opcionais, mas subconjunto pede máquina e máquina pede linha.
 * `saved` é o que a ficha já tinha gravado (nulo numa ficha nova).
 * Ex.: `assertMachineSpot({ lineId: "l1", machineId: "m1", subassemblyId: null }, await refs.machineSpot("m1", null), null)`
 */
export function assertMachineSpot(spot: MachineSpot, refs: MachineSpotRefs, saved: MachineSpot | null): void {
  if (spot.subassemblyId && !spot.machineId) throw new DomainError("machine", 400, "Escolha a máquina do subconjunto.");
  if (!spot.machineId) return;
  if (!spot.lineId) throw new DomainError("machine", 400, "Escolha a linha da máquina.");
  if (!refs.machine) throw new DomainError("machine", 400, `Máquina não encontrada (id ${spot.machineId}).`);
  if (refs.machine.lineId !== spot.lineId) throw new DomainError("machine", 400, "Esta máquina não é da linha escolhida.");
  if (!spot.subassemblyId) return;
  if (!refs.subassembly) throw new DomainError("subassembly", 400, `Subconjunto não encontrado (id ${spot.subassemblyId}).`);
  assertSubassemblyFits(refs.machine, refs.subassembly, saved?.subassemblyId ?? null);
}

// Nome para comparar: sem acento, minúsculo e com espaços simples.
export function foldName(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
