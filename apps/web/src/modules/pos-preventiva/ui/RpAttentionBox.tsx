import { Link } from "react-router-dom";
import type { PostPreventiveDto } from "@manutencao/shared";
import { Card } from "../../../design/ui/controls";
import { useMachines, useSubassemblies } from "../../cadastro/data/cadastro";
import { formatDay } from "../../colaborador/model/pdi-items";
import { usePostPreventives } from "../data/post-preventives";

// No RP: só as fichas pós-preventiva ligadas a este RP. Só leitura.
// Os pontos ativos da linha inteira saíram a pedido do Léo (2026-11-09): o RP só mostra o ponto de atenção
// quando já está ligado a ele, nunca a lista da linha ou da máquina.
export function RpAttentionBox({ rpId }: { rpId: string }) {
  const linked = usePostPreventives({ rpId });
  const where = usePlaceNames();
  const links = linked.data ?? [];
  if (!links.length) return null;

  return (
    <Card className="mb-4">
      <h2 className="text-sm font-semibold text-app">Pós-preventiva</h2>
      <p className="mt-1 text-xs text-muted">Fichas ligadas a este RP.</p>
      <ul className="mt-2 flex flex-col gap-2">
        {links.map((item) => (
          <LinkedPostPreventive key={item.id} item={item} where={where(item.machineId, item.subassemblyId)} />
        ))}
      </ul>
    </Card>
  );
}

function LinkedPostPreventive({ item, where }: { item: PostPreventiveDto; where: string }) {
  return (
    <li>
      <Link to={`/pos-preventiva/${item.id}`} className="block text-sm text-app hover:text-accent">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          {formatDay(item.preventiveDate)} · {where}
        </span>
        <span className="block">{item.occurrence}</span>
      </Link>
    </li>
  );
}

// "Máquina · Subconjunto" pelos nomes do cadastro, com rótulo genérico enquanto o cadastro carrega.
function usePlaceNames(): (machineId: string, subassemblyId: string) => string {
  const machines = useMachines();
  const subassemblies = useSubassemblies();
  const machineNames = new Map(machines.data?.map((machine) => [machine.id, machine.name]));
  const subassemblyNames = new Map(subassemblies.data?.map((item) => [item.id, item.name]));
  return (machineId, subassemblyId) =>
    `${machineNames.get(machineId) ?? "Máquina"} · ${subassemblyNames.get(subassemblyId) ?? "Subconjunto"}`;
}
