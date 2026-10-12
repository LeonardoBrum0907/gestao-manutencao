import { subassemblyReaches, type SubassemblyHolder, type SubassemblyScope } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

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
 * Só dá para desmarcar na máquina um subconjunto que chega a ela (do modelo ou dela mesma).
 * Ex.: `assertHideable(maquina, ["s1"], new Map([["s1", subconjunto]]))`
 */
export function assertHideable(machine: SubassemblyHolder, ids: string[], subassemblies: Map<string, SubassemblyScope>): void {
  for (const id of ids) {
    const subassembly = subassemblies.get(id);
    if (!subassembly) throw new DomainError("subassembly", 400, `Subconjunto não encontrado (id ${id}).`);
    if (!subassemblyReaches(subassembly, machine)) {
      throw new DomainError("subassembly", 400, `O subconjunto ${id} não é desta máquina; só dá para desmarcar os do modelo ou dela.`);
    }
  }
}
