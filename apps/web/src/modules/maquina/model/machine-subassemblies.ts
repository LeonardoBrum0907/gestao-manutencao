import { subassemblyReaches, type SubassemblyDto, type SubassemblyHolder } from "@manutencao/shared";

export type MachineSubassemblyGroups = { model: SubassemblyDto[]; version: SubassemblyDto[]; own: SubassemblyDto[] };

/**
 * Subconjuntos ativos que chegam à máquina, separados por origem: do modelo, da versão dela e só dela.
 * Os desmarcados continuam na lista (a tela mostra a caixa vazia para poder marcar de novo).
 * @example machineSubassemblyGroups(todos, maquina).version // os da M092, se a máquina é M092
 */
export function machineSubassemblyGroups(subassemblies: SubassemblyDto[], machine: SubassemblyHolder): MachineSubassemblyGroups {
  const reaching = subassemblies.filter((item) => !item.archived && subassemblyReaches(item, machine));
  return {
    model: reaching.filter((item) => !item.versionId && !item.machineId),
    version: reaching.filter((item) => Boolean(item.versionId)),
    own: reaching.filter((item) => Boolean(item.machineId)),
  };
}

/**
 * Nova lista de desmarcados ao marcar ou desmarcar um subconjunto na máquina.
 * @example toggledHidden(["s1"], "s2", false) // ["s1", "s2"]
 */
export function toggledHidden(hidden: string[], subassemblyId: string, has: boolean): string[] {
  const rest = hidden.filter((id) => id !== subassemblyId);
  return has ? rest : [...rest, subassemblyId];
}
