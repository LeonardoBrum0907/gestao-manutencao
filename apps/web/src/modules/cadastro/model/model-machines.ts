import type { LineDto, MachineDto } from "@manutencao/shared";

export type ModelMachine = { id: string; label: string };

/**
 * Máquinas que usam o modelo, com a linha na frente, em ordem de linha (CAM 2 antes de CAM 10).
 * É por elas que os subconjuntos do modelo chegam às fichas: o subconjunto não se liga direto à máquina.
 * @example machinesOfModel(machines, lines, "blistadeira-cam") // [{ id: "m1", label: "CAM 01 · Blistadeira" }]
 */
export function machinesOfModel(machines: MachineDto[], lines: LineDto[], equipmentId: string): ModelMachine[] {
  const lineName = new Map(lines.map((line) => [line.id, line.name]));
  return machines
    .filter((machine) => machine.equipmentId === equipmentId)
    .map((machine) => ({ id: machine.id, label: `${lineName.get(machine.lineId) ?? "Linha"} · ${machine.name}` }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR", { numeric: true }));
}

/**
 * Texto curto de uso do modelo para a lista de modelos. Máquina zerada aparece quando já há subconjunto,
 * porque aí os subconjuntos não chegam a máquina nenhuma.
 * @example modelUsageText(0, 1) // "nenhuma máquina · 1 subconjunto"
 */
export function modelUsageText(machineCount: number, subassemblyCount: number): string {
  if (!machineCount && !subassemblyCount) return "sem uso";
  const machinesText = machineCount === 1 ? "1 máquina" : machineCount ? `${machineCount} máquinas` : "nenhuma máquina";
  if (!subassemblyCount) return machinesText;
  return `${machinesText} · ${subassemblyCount === 1 ? "1 subconjunto" : `${subassemblyCount} subconjuntos`}`;
}
