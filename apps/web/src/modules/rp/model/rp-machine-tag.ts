import { sameRpPlace, type LineDto, type MachineDto } from "@manutencao/shared";
import type { RpFormValues } from "./rp";

// O time escreve a TAG com caixa, espaços e pontuação variados ("ebs-bli-01", "EBS-BLI- 01", "EBS-DOB-34.",
// "EBS BLI 6"): sameRpPlace compara só letras e números, sem zero à esquerda.
function machinesWithTag<Machine extends Pick<MachineDto, "tag">>(tag: string, machines: readonly Machine[]): Machine[] {
  return machines.filter((machine) => machine.tag && sameRpPlace(tag, machine.tag));
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
  const found = machinesWithTag(values.tag, machines);
  if (found.length !== 1 || (values.lineId && values.lineId !== found[0].lineId)) return values;
  const machine = found[0];
  const factoryId = lines.find((line) => line.id === machine.lineId)?.factoryId ?? values.factoryId;
  return { ...values, machineId: machine.id, lineId: machine.lineId, factoryId };
}

/**
 * Aviso para o RP colado quando a TAG é de uma máquina de outra linha (ex.: "Med 8" com a TAG da Blistadeira da
 * MED 06). Nesse caso withMachineFromTag deixa a máquina em branco, e sem o aviso ninguém percebe.
 * @example tagLineConflict(valores, maquinas, linhas) // "A TAG EBS-BLI-21 é da Blistadeira da MED 06, mas …"
 */
export function tagLineConflict(
  values: RpFormValues,
  machines: readonly Pick<MachineDto, "lineId" | "tag" | "name">[],
  lines: readonly Pick<LineDto, "id" | "name">[],
): string | null {
  if (values.machineId || !values.lineId || !values.tag.trim()) return null;
  const found = machinesWithTag(values.tag, machines);
  if (found.length !== 1 || found[0].lineId === values.lineId) return null;
  const lineName = (id: string) => lines.find((line) => line.id === id)?.name ?? "outra linha";
  const machine = found[0];
  return `A TAG ${values.tag.trim()} é da ${machine.name} da ${lineName(machine.lineId)}, mas a linha lida foi ${lineName(values.lineId)}. Confira a linha e a máquina.`;
}
