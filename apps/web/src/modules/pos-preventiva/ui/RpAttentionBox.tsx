import { Link } from "react-router-dom";
import { Card } from "../../../design/ui/controls";
import { useMachines, useSubassemblies } from "../../cadastro/data/cadastro";
import { formatDay } from "../../colaborador/model/pdi-items";
import { usePostPreventives } from "../data/post-preventives";

// No RP: os pontos de atenção ativos da mesma linha e as fichas pós-preventiva ligadas a este RP. Só leitura.
export function RpAttentionBox({ rpId, lineId }: { rpId: string; lineId: string | null }) {
  const active = usePostPreventives({ lineId: lineId ?? "", active: "true" }, Boolean(lineId));
  const linked = usePostPreventives({ rpId });
  const machines = useMachines();
  const subassemblies = useSubassemblies();
  const machineNames = new Map(machines.data?.map((machine) => [machine.id, machine.name]));
  const subassemblyNames = new Map(subassemblies.data?.map((item) => [item.id, item.name]));
  const points = lineId ? (active.data ?? []) : [];
  const links = (linked.data ?? []).filter((item) => !points.some((point) => point.id === item.id));
  if (!points.length && !links.length) return null;

  const where = (machineId: string, subassemblyId: string) =>
    `${machineNames.get(machineId) ?? "Máquina"} · ${subassemblyNames.get(subassemblyId) ?? "Subconjunto"}`;

  return (
    <Card className="mb-4">
      <h2 className="text-sm font-semibold text-app">Pós-preventiva</h2>
      {points.length ? (
        <>
          <p className="mt-1 text-xs text-muted">Pontos de atenção ativos nesta linha.</p>
          <ul className="mt-2 flex flex-col gap-2">
            {points.map((item) => (
              <li key={item.id}>
                <Link to={`/pos-preventiva/${item.id}`} className="block text-sm text-app hover:text-accent">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{where(item.machineId, item.subassemblyId)}</span>
                  <span className="block">{item.attentionPoint}</span>
                </Link>
                {item.rpId === rpId ? <span className="text-xs font-semibold text-accent">Ligado a este RP</span> : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {links.length ? (
        <>
          <p className="mt-3 text-xs text-muted">Fichas ligadas a este RP.</p>
          <ul className="mt-2 flex flex-col gap-2">
            {links.map((item) => (
              <li key={item.id}>
                <Link to={`/pos-preventiva/${item.id}`} className="block text-sm text-app hover:text-accent">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    {formatDay(item.preventiveDate)} · {where(item.machineId, item.subassemblyId)}
                  </span>
                  <span className="block">{item.occurrence}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Card>
  );
}
