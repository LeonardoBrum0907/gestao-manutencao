import type { LineDto, MachineDto } from "@manutencao/shared";
import type { RpFormValues } from "./rp";

// O time escreve a TAG com caixa e espaços variados ("ebs-bli-01", "EBS-BLI- 01").
function tagKey(tag: string): string {
  return tag.replace(/\s+/g, "").toUpperCase();
}

/**
 * Escolhe a máquina do RP colado pela TAG do texto, que o parser não liga ao cadastro. Só escolhe quando uma única
 * máquina tem essa TAG e ela é da linha reconhecida (ou nenhuma linha foi reconhecida); a linha e a fábrica vêm junto.
 * @example withMachineFromTag({ ...valores, tag: "EBS-BLI-01" }, maquinas, linhas).machineId // "id da Blistadeira 01"
 */
export function withMachineFromTag(
  values: RpFormValues,
  machines: readonly Pick<MachineDto, "id" | "lineId" | "tag">[],
  lines: readonly Pick<LineDto, "id" | "factoryId">[],
): RpFormValues {
  if (values.machineId || !values.tag.trim()) return values;
  const found = machines.filter((machine) => machine.tag && tagKey(machine.tag) === tagKey(values.tag));
  if (found.length !== 1 || (values.lineId && values.lineId !== found[0].lineId)) return values;
  const machine = found[0];
  const factoryId = lines.find((line) => line.id === machine.lineId)?.factoryId ?? values.factoryId;
  return { ...values, machineId: machine.id, lineId: machine.lineId, factoryId };
}
