import { subassemblyReaches, type SubassemblyDto, type SubassemblyHolder } from "@manutencao/shared";

export type MachineSubassemblyGroups = { model: SubassemblyDto[]; own: SubassemblyDto[] };

/**
 * Subconjuntos ativos que chegam à máquina, separados por origem: do modelo dela e só dela.
 * Os desmarcados continuam na lista (a tela mostra a caixa vazia para poder marcar de novo).
 * @example machineSubassemblyGroups(todos, maquina).own // os só desta máquina
 */
export function machineSubassemblyGroups(subassemblies: SubassemblyDto[], machine: SubassemblyHolder): MachineSubassemblyGroups {
  const reaching = subassemblies.filter((item) => !item.archived && subassemblyReaches(item, machine));
  return {
    model: reaching.filter((item) => !item.machineId),
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
