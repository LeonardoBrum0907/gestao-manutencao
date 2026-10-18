import { isMachineStatus, type MachineOperationalStatus } from "@manutencao/shared";

/**
 * Situação pedida no filtro da lista de Máquinas (?situacao=stopped). Valor que não é situação de máquina, como um
 * endereço antigo ou digitado à mão, vale como "todas" em vez de esvaziar a lista.
 * @example machineStatusFilter("stopped") // "stopped"
 * @example machineStatusFilter("parada") // null
 */
export function machineStatusFilter(param: string | null): MachineOperationalStatus | null {
  if (!param || !isMachineStatus(param)) return null;
  return param;
}
