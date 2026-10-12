import { DomainError } from "../../kernel/domain-error";

export type PlaceMachine = { equipmentId: string | null } | null;

/**
 * Onde o subconjunto novo vale: no modelo todo (null) ou só numa máquina, que precisa ser do mesmo modelo.
 * Ex.: `subassemblyPlace("blis-m91", "m1", { equipmentId: "blis-m91" })` // "m1"
 */
export function subassemblyPlace(equipmentId: string, machineId: string | null, machine: PlaceMachine): string | null {
  if (!machineId) return null;
  if (!machine) throw new DomainError("machine", 400, `Máquina não encontrada (id ${machineId}).`);
  if (machine.equipmentId !== equipmentId) throw new DomainError("machine", 400, "Esta máquina é de outro modelo de equipamento.");
  return machineId;
}
