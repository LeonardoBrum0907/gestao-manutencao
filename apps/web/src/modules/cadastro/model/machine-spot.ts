import { subassembliesOfMachine, type MachineDto, type SubassemblyDto, type SubassemblyHolder } from "@manutencao/shared";

/**
 * Subconjuntos que a ficha pode usar: os ativos que chegam à máquina (do modelo dela ou só dela),
 * menos os desmarcados nela, e o que a ficha já tinha (mesmo arquivado).
 * @example subassemblyChoices(todos, maquina, ficha.subassemblyId)
 */
export function subassemblyChoices(subassemblies: SubassemblyDto[], machine: SubassemblyHolder | undefined, currentId: string): SubassemblyDto[] {
  if (!machine?.equipmentId) return [];
  return subassembliesOfMachine(subassemblies, machine, currentId);
}

// A tela pode publicar antes do deploy da API no PC (armadilha do PR #41): campo novo que não veio vira o padrão.
type LegacyMachine = Omit<MachineDto, "hiddenSubassemblyIds"> & Partial<Pick<MachineDto, "hiddenSubassemblyIds">>;
type LegacySubassembly = Omit<SubassemblyDto, "machineId"> & Partial<Pick<SubassemblyDto, "machineId">>;

/**
 * Máquina da API, com desmarcados vazios quando a API ainda é a antiga.
 * @example withMachineDefaults({ ...maquina }) // { ..., hiddenSubassemblyIds: [] }
 */
export function withMachineDefaults(machine: LegacyMachine): MachineDto {
  return { ...machine, hiddenSubassemblyIds: machine.hiddenSubassemblyIds ?? [] };
}

/**
 * Subconjunto da API, valendo para o modelo todo quando a API ainda é a antiga.
 * @example withSubassemblyDefaults({ id: "s1", equipmentId: "blis", name: "Desbobinador", archived: false })
 */
export function withSubassemblyDefaults(subassembly: LegacySubassembly): SubassemblyDto {
  return { ...subassembly, machineId: subassembly.machineId ?? null };
}
