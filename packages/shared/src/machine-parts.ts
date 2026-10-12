import type { MachineDto, SubassemblyDto } from "./index";

// Versão de um modelo de equipamento (M092 e NMX da Blistadeira Uhlmann). A matriz de habilidades continua no modelo.
export type EquipmentVersionDto = {
  id: string;
  equipmentId: string;
  name: string;
  archived: boolean;
};

// O mínimo da máquina para saber quais subconjuntos ela tem.
export type SubassemblyHolder = Pick<MachineDto, "id" | "equipmentId" | "versionId" | "hiddenSubassemblyIds">;

// O mínimo do subconjunto para saber a quem ele vale.
export type SubassemblyScope = Pick<SubassemblyDto, "equipmentId" | "versionId" | "machineId">;

/**
 * O subconjunto alcança a máquina: é do modelo dela e, quando tem versão ou máquina, é da versão ou da máquina dela.
 * Não olha arquivado nem escondido; isso é escolha da lista.
 * @example subassemblyReaches({ equipmentId: "blis", versionId: "m092", machineId: null }, machine) // true se a máquina é M092
 */
export function subassemblyReaches(subassembly: SubassemblyScope, machine: SubassemblyHolder): boolean {
  if (!machine.equipmentId || subassembly.equipmentId !== machine.equipmentId) return false;
  if (subassembly.machineId) return subassembly.machineId === machine.id;
  if (subassembly.versionId) return subassembly.versionId === machine.versionId;
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
 * O do modelo aparece com todos; os de versões ou máquinas diferentes nunca se encontram.
 * versionOfMachine diz a versão da máquina de um subconjunto próprio.
 * @example scopesOverlap({ versionId: "m092", machineId: null }, { versionId: null, machineId: "cam01" }, () => "m092") // true
 */
export function scopesOverlap(
  first: Pick<SubassemblyScope, "versionId" | "machineId">,
  second: Pick<SubassemblyScope, "versionId" | "machineId">,
  versionOfMachine: (machineId: string) => string | null,
): boolean {
  if (!first.versionId && !first.machineId) return true;
  if (!second.versionId && !second.machineId) return true;
  return reachedVersion(first, versionOfMachine) === reachedVersion(second, versionOfMachine) && sameMachineOrVersion(first, second);
}

function reachedVersion(scope: Pick<SubassemblyScope, "versionId" | "machineId">, versionOfMachine: (machineId: string) => string | null) {
  return scope.machineId ? versionOfMachine(scope.machineId) : scope.versionId;
}

// Versão com versão já bate pela versão; máquina com máquina só se for a mesma; versão com máquina bate pela versão.
function sameMachineOrVersion(first: Pick<SubassemblyScope, "machineId">, second: Pick<SubassemblyScope, "machineId">): boolean {
  if (first.machineId && second.machineId) return first.machineId === second.machineId;
  return true;
}
