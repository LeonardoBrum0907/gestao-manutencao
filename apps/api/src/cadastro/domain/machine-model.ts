import { subassemblyReaches, type SubassemblyHolder, type SubassemblyScope } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

export type VersionRef = { id: string; equipmentId: string; archived: boolean };

/**
 * A versão escolhida no cadastro da máquina é do modelo dela. Arquivada só fica se a máquina já estava nela.
 * Ex.: `machineVersion("blis", "m092", versao, maquinaAtual?.versionId ?? null)` // "m092"
 */
export function machineVersion(equipmentId: string | null, versionId: string | null, version: VersionRef | null, currentVersionId: string | null): string | null {
  if (!versionId) return null;
  if (!equipmentId) throw new DomainError("version", 400, "Escolha o modelo de equipamento antes da versão.");
  if (!version) throw new DomainError("version", 400, `Versão não encontrada (id ${versionId}).`);
  if (version.equipmentId !== equipmentId) throw new DomainError("version", 400, "Esta versão é de outro modelo de equipamento.");
  if (version.archived && version.id !== currentVersionId) throw new DomainError("version", 400, "Esta versão está arquivada.");
  return versionId;
}

/**
 * Os subconjuntos próprios da máquina são do modelo dela; trocar o modelo os deixaria apontando para outro equipamento.
 * Ex.: `assertModelChangeAllowed("blis", "enc", 2)` // recusa
 */
export function assertModelChangeAllowed(currentEquipmentId: string | null, nextEquipmentId: string | null, ownSubassemblies: number): void {
  if (currentEquipmentId === nextEquipmentId || ownSubassemblies === 0) return;
  throw new DomainError(
    "machine_model_locked",
    409,
    `Esta máquina tem ${ownSubassemblies === 1 ? "1 subconjunto próprio" : `${ownSubassemblies} subconjuntos próprios`}; exclua ou arquive antes de trocar o modelo.`,
  );
}

/**
 * Só dá para desmarcar na máquina um subconjunto que chega a ela (do modelo, da versão ou dela mesma).
 * Ex.: `assertHideable(maquina, ["s1"], new Map([["s1", subconjunto]]))`
 */
export function assertHideable(machine: SubassemblyHolder, ids: string[], subassemblies: Map<string, SubassemblyScope>): void {
  for (const id of ids) {
    const subassembly = subassemblies.get(id);
    if (!subassembly) throw new DomainError("subassembly", 400, `Subconjunto não encontrado (id ${id}).`);
    if (!subassemblyReaches(subassembly, machine)) {
      throw new DomainError("subassembly", 400, `O subconjunto ${id} não é desta máquina; só dá para desmarcar os do modelo, da versão ou dela.`);
    }
  }
}
