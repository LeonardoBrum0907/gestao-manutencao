import { DomainError } from "../../kernel/domain-error";
import type { SubassemblyPlace } from "./hierarchy";

export type PlaceRefs = {
  version: { equipmentId: string; archived: boolean } | null;
  machine: { equipmentId: string | null } | null;
};

/**
 * Onde o subconjunto novo vale: no modelo todo, numa versão ou numa máquina (nunca nas duas).
 * A versão e a máquina precisam ser do mesmo modelo do subconjunto.
 * Ex.: `subassemblyPlace("blis", { versionId: "m092", machineId: null }, { version, machine: null })`
 */
export function subassemblyPlace(equipmentId: string, wanted: SubassemblyPlace, refs: PlaceRefs): SubassemblyPlace {
  if (wanted.versionId && wanted.machineId) {
    throw new DomainError("invalid", 400, "O subconjunto vale para uma versão ou para uma máquina, não para as duas.");
  }
  if (wanted.versionId) return { versionId: checkedVersion(equipmentId, wanted.versionId, refs.version), machineId: null };
  if (wanted.machineId) return { versionId: null, machineId: checkedMachine(equipmentId, wanted.machineId, refs.machine) };
  return { versionId: null, machineId: null };
}

function checkedVersion(equipmentId: string, versionId: string, version: PlaceRefs["version"]): string {
  if (!version) throw new DomainError("version", 400, `Versão não encontrada (id ${versionId}).`);
  if (version.equipmentId !== equipmentId) throw new DomainError("version", 400, "Esta versão é de outro modelo de equipamento.");
  if (version.archived) throw new DomainError("version", 400, "Esta versão está arquivada.");
  return versionId;
}

function checkedMachine(equipmentId: string, machineId: string, machine: PlaceRefs["machine"]): string {
  if (!machine) throw new DomainError("machine", 400, `Máquina não encontrada (id ${machineId}).`);
  if (machine.equipmentId !== equipmentId) throw new DomainError("machine", 400, "Esta máquina é de outro modelo de equipamento.");
  return machineId;
}
