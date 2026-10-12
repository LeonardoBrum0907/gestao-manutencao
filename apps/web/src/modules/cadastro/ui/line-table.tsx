import type { LineDto } from "@manutencao/shared";
import type { StackedRow, TableColumn } from "../../../design/ui/data-table";
import { machineStatusClass, machineStatusLabel } from "../model/labels";

// Uma linha de produção com a fábrica e a contagem de máquinas já resolvidas.
export type LineTableRow = { line: LineDto; factory: string; machines: number };

function machineCountText(count: number): string {
  if (!count) return "Sem máquinas";
  return `${count} ${count === 1 ? "máquina" : "máquinas"}`;
}

const yesNo = (value: boolean) => (value ? "Sim" : <span className="text-muted">—</span>);

function StatusText({ line }: { line: LineDto }) {
  return <span className={machineStatusClass(line.status) || "text-muted"}>{machineStatusLabel(line.status)}</span>;
}

/**
 * Colunas de Configurações › Linhas; a fábrica vai na faixa do grupo e as marcas viram colunas de sim ou não.
 * @example <DataTable columns={LINE_COLUMNS} groupBy={(row) => ({ key: row.line.factoryId, title: row.factory })} ... />
 */
export const LINE_COLUMNS: TableColumn<LineTableRow>[] = [
  { key: "name", header: "Linha", cell: (row) => row.line.name, sortValue: (row) => row.line.name },
  { key: "tag", header: "TAG", cell: (row) => row.line.internalCode ?? <span className="text-muted">—</span>, sortValue: (row) => row.line.internalCode },
  { key: "machines", header: "Máquinas", cell: (row) => row.machines || <span className="text-muted">—</span>, sortValue: (row) => row.machines, align: "right" },
  { key: "daily", header: "GD", cell: (row) => yesNo(row.line.isDailyLine), sortValue: (row) => (row.line.isDailyLine ? "Sim" : null) },
  { key: "critical", header: "Apadrinhada", cell: (row) => yesNo(row.line.isCritical), sortValue: (row) => (row.line.isCritical ? "Sim" : null) },
  { key: "status", header: "Situação", cell: (row) => <StatusText line={row.line} />, sortValue: (row) => machineStatusLabel(row.line.status) },
];

/**
 * A linha no celular: nome, máquinas e marcas; a situação só aparece quando está parada.
 * @example stacked={lineStacked}
 */
export function lineStacked(row: LineTableRow): StackedRow {
  const { line } = row;
  const marks = [machineCountText(row.machines), line.internalCode ? `TAG ${line.internalCode}` : null, line.isDailyLine ? "Linha de GD" : null, line.isCritical ? "Apadrinhada" : null];
  return {
    title: line.name,
    meta: marks.filter(Boolean).join(" · "),
    side: line.status === "stopped" ? <StatusText line={line} /> : null,
  };
}
