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

/**
 * Texto de ajuda do bloco "Subconjuntos": sem nenhum subconjunto não há o que desmarcar,
 * então diz isso e aponta onde cadastrar.
 * @example subassemblyChecklistHint({ model: [], own: [] }, "PH-200") // "O modelo PH-200 ainda não tem subconjunto. …"
 */
export function subassemblyChecklistHint(groups: MachineSubassemblyGroups, modelName: string): string {
  if (groups.model.length || groups.own.length) return "Desmarque o que esta máquina não tem. Só o que está marcado aparece nas fichas dela.";
  return `O modelo ${modelName} ainda não tem subconjunto. Cadastre em "Editar no modelo" ou crie um só desta máquina.`;
}
