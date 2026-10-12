import type { LineDto, MachineDto } from "@manutencao/shared";
import type { StackedRow, TableColumn } from "../../../design/ui/data-table";
import { machineStatusClass, machineStatusLabel } from "../../cadastro/model/labels";

// Uma linha da tabela de máquinas, já com os nomes que vêm de outros cadastros.
export type MachineTableRow = { machine: MachineDto; line: LineDto | undefined; place: string; model: string | null; points: number };

function PointsChip({ count }: { count: number }) {
  if (!count) return <span className="text-muted">—</span>;
  return (
    <span className="rounded-control bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
      {count} {count === 1 ? "ponto ativo" : "pontos ativos"}
    </span>
  );
}

// Só a parada ganha cor; as outras situações ficam em cinza.
function StatusText({ machine }: { machine: MachineDto }) {
  return <span className={machineStatusClass(machine.status) || "text-muted"}>{machineStatusLabel(machine.status)}</span>;
}

/**
 * Colunas da tela Máquinas; a fábrica e a linha vão na faixa do grupo.
 * @example <DataTable columns={MACHINE_COLUMNS} groupBy={(row) => ({ key: row.machine.lineId, title: row.place })} ... />
 */
export const MACHINE_COLUMNS: TableColumn<MachineTableRow>[] = [
  { key: "name", header: "Máquina", cell: (row) => row.machine.name, sortValue: (row) => row.machine.name },
  { key: "model", header: "Modelo", cell: (row) => row.model ?? <span className="text-muted">Sem modelo</span>, sortValue: (row) => row.model },
  { key: "tag", header: "TAG", cell: (row) => row.machine.tag ?? "—", sortValue: (row) => row.machine.tag },
  { key: "status", header: "Situação", cell: (row) => <StatusText machine={row.machine} />, sortValue: (row) => machineStatusLabel(row.machine.status) },
  { key: "points", header: "Pontos de atenção", cell: (row) => <PointsChip count={row.points} />, sortValue: (row) => row.points || null, align: "right" },
];

/**
 * A máquina no celular: nome, modelo e TAG; os pontos ativos e a parada ficam à direita.
 * @example stacked={machineStacked}
 */
export function machineStacked(row: MachineTableRow): StackedRow {
  const stopped = row.machine.status === "stopped" ? <StatusText machine={row.machine} /> : null;
  return {
    title: row.machine.name,
    meta: [row.model ?? "Sem modelo", row.machine.tag ? `TAG ${row.machine.tag}` : null].filter(Boolean).join(" · "),
    side: row.points ? <PointsChip count={row.points} /> : stopped,
  };
}
