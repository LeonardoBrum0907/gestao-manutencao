import type { ChamadoDto } from "@manutencao/shared";
import type { StackedRow, TableColumn } from "../../../design/ui/data-table";
import { chamadoStatusChipClass, chamadoStatusLabel, hours } from "../model/chamado";

// Um chamado da lista com a linha, a máquina e os técnicos já resolvidos pelos cadastros.
export type ChamadoTableRow = { item: ChamadoDto; line: string; machine: string; people: string };

const chip = "rounded-control px-2 py-0.5 text-xs font-semibold";

// O que o chamado gerou (RP, pendências) fica junto do texto, para quem bate o olho saber que tem continuação.
function Marks({ item }: { item: ChamadoDto }) {
  if (!item.rp && !item.tasks.length) return null;
  return (
    <span className="mt-1 flex flex-wrap gap-1.5">
      {item.rp ? <span className={`${chip} bg-chip text-app`}>RP</span> : null}
      {item.tasks.length ? (
        <span className={`${chip} bg-danger-soft text-danger`}>{item.tasks.length === 1 ? "Pendência" : `${item.tasks.length} pendências`}</span>
      ) : null}
    </span>
  );
}

function BodyWithMarks({ item }: { item: ChamadoDto }) {
  return (
    <span className="block">
      <span className="line-clamp-2 block" title={item.body}>
        {item.body}
      </span>
      <Marks item={item} />
    </span>
  );
}

function PlaceCell({ row }: { row: ChamadoTableRow }) {
  return (
    <span className="block">
      <span className="block font-semibold">{row.line}</span>
      {row.machine ? <span className="block text-xs text-muted">{row.machine}</span> : null}
    </span>
  );
}

const StatusChip = ({ item }: { item: ChamadoDto }) => <span className={chamadoStatusChipClass(item.status)}>{chamadoStatusLabel(item.status)}</span>;

/**
 * Colunas da tela Chamados; o turno vai na faixa do grupo.
 * @example <DataTable columns={CHAMADO_COLUMNS} groupBy={(row) => shiftGroup(row.item)} ... />
 */
export const CHAMADO_COLUMNS: TableColumn<ChamadoTableRow>[] = [
  { key: "number", header: "Nº", cell: (row) => (row.item.dayNumber ? `nº ${row.item.dayNumber}` : "—"), sortValue: (row) => row.item.dayNumber, className: "tabular-nums" },
  { key: "hours", header: "Horário", cell: (row) => <span className="tabular-nums text-muted">{hours(row.item)}</span>, sortValue: (row) => row.item.openedAt ?? row.item.occurredAt },
  { key: "place", header: "Linha · máquina", cell: (row) => <PlaceCell row={row} />, sortValue: (row) => `${row.line} ${row.machine}` },
  { key: "body", header: "O que aconteceu", cell: (row) => <BodyWithMarks item={row.item} />, wrap: "rich" },
  { key: "people", header: "Técnicos", cell: (row) => row.people || "—", sortValue: (row) => row.people, wrap: "short" },
  { key: "status", header: "Status", cell: (row) => <StatusChip item={row.item} />, sortValue: (row) => chamadoStatusLabel(row.item.status) },
];

/**
 * O chamado no celular: número e horário em cima, o texto no meio, lugar e técnicos embaixo.
 * @example stacked={chamadoStacked}
 */
export function chamadoStacked(row: ChamadoTableRow): StackedRow {
  return {
    eyebrow: `${row.item.dayNumber ? `nº ${row.item.dayNumber} · ` : ""}${hours(row.item)}`,
    title: <span className="font-normal"><BodyWithMarks item={row.item} /></span>,
    meta: [row.line, row.machine, row.people].filter(Boolean).join(" · "),
    side: <StatusChip item={row.item} />,
  };
}
