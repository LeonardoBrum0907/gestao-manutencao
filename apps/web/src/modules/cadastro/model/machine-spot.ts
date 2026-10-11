import type { SubassemblyDto } from "@manutencao/shared";

// Subconjuntos que a ficha pode usar: os ativos do modelo da máquina e o que a ficha já tinha (mesmo arquivado).
export function subassemblyChoices(subassemblies: SubassemblyDto[], equipmentId: string | null, currentId: string): SubassemblyDto[] {
  if (!equipmentId) return [];
  return subassemblies.filter((item) => item.equipmentId === equipmentId && (!item.archived || item.id === currentId));
}
