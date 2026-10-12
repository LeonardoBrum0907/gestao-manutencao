import type { MachineDto, SubassemblyDto } from "./index";

// O mínimo da máquina para saber quais subconjuntos ela tem.
export type SubassemblyHolder = Pick<MachineDto, "id" | "equipmentId" | "hiddenSubassemblyIds">;

// O mínimo do subconjunto para saber a quem ele vale.
export type SubassemblyScope = Pick<SubassemblyDto, "equipmentId" | "machineId">;

/**
 * O subconjunto alcança a máquina: é do modelo dela e, quando é de uma máquina só, é dela.
 * Não olha arquivado nem escondido; isso é escolha da lista.
 * @example subassemblyReaches({ equipmentId: "blis-m91", machineId: null }, machine) // true se a máquina é do modelo blis-m91
 */
export function subassemblyReaches(subassembly: SubassemblyScope, machine: SubassemblyHolder): boolean {
  if (!machine.equipmentId || subassembly.equipmentId !== machine.equipmentId) return false;
  if (subassembly.machineId) return subassembly.machineId === machine.id;
  return true;
}

/**
 * Subconjuntos que uma ficha da máquina pode escolher: os que alcançam a máquina, ativos e não escondidos nela.
 * O que a ficha já tinha gravado (keepId) fica na lista mesmo arquivado, escondido ou fora do alcance.
 * @example subassembliesOfMachine(all, machine, record.subassemblyId ?? "")
 */
export function subassembliesOfMachine<T extends SubassemblyDto>(subassemblies: T[], machine: SubassemblyHolder, keepId: string): T[] {
  const hidden = new Set(machine.hiddenSubassemblyIds);
  return subassemblies.filter(
    (item) => item.id === keepId || (!item.archived && !hidden.has(item.id) && subassemblyReaches(item, machine)),
  );
}

/**
 * Dois subconjuntos do mesmo modelo podem aparecer juntos numa máquina, e aí não podem ter o mesmo nome.
 * O do modelo aparece com todos; os só de máquinas diferentes nunca se encontram.
 * @example scopesOverlap({ machineId: "cam01" }, { machineId: "cam02" }) // false
 */
export function scopesOverlap(first: Pick<SubassemblyScope, "machineId">, second: Pick<SubassemblyScope, "machineId">): boolean {
  if (!first.machineId || !second.machineId) return true;
  return first.machineId === second.machineId;
}
