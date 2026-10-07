import { useState } from "react";
import { Link } from "react-router-dom";
import type { LineDto } from "@manutencao/shared";
import { Button } from "../../../design/ui/controls";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { useMachines } from "../data/cadastro";
import { machineStatusClass, machineStatusLabel } from "../model/labels";
import { MachineFormModal } from "./MachineFormModal";

// Máquinas (equipamentos) de uma linha: etiquetas no cartão da linha que levam à tela da máquina.
export function LineMachines({ line }: { line: LineDto }) {
  const machines = useMachines();
  const catalog = useMatrixCatalog();
  const [creating, setCreating] = useState(false);
  const mine = (machines.data ?? []).filter((machine) => machine.lineId === line.id);
  const equipmentName = new Map(catalog.data?.equipments.map((equipment) => [equipment.id, equipment.name]));

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">Máquinas</span>
      {mine.length === 0 ? <span className="text-sm text-muted">Nenhuma ainda.</span> : null}
      {mine.map((machine) => (
        <Link
          key={machine.id}
          to={`/maquinas/${machine.id}`}
          className="rounded-control border border-line bg-chip px-2.5 py-1 text-sm text-app transition hover:bg-accent-soft"
        >
          {machine.name}
          {machine.equipmentId ? <span className="text-muted"> · {equipmentName.get(machine.equipmentId) ?? "Modelo"}</span> : null}
          {machine.status === "stopped" ? (
            <span className={machineStatusClass(machine.status)}> · {machineStatusLabel(machine.status)}</span>
          ) : null}
        </Link>
      ))}
      <Button tone="ghost" className="px-2.5 py-1" onClick={() => setCreating(true)}>
        + Máquina
      </Button>
      {creating ? <MachineFormModal line={line} machine={null} onClose={() => setCreating(false)} /> : null}
    </div>
  );
}
