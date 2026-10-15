import type { StackedRow, TableColumn } from "../../../design/ui/data-table";
import { dueDay, dueLabel, todayDay } from "../model/board";
import { dueClockOf } from "../model/due-time";
import { originLabel, recordShortName, recordStatusLabel } from "../model/record";
import { placeLabel, type RecordRow } from "../model/records-table";

// Colunas da tabela de Registros (computador) e a versão empilhada do celular.

const dayMonth = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "short" });

function shortDay(iso: string): string {
  return dayMonth.format(new Date(iso)).replace(".", "").replace(" de ", " ");
}

function Dash() {
  return <span className="text-muted">—</span>;
}

function StatusChip({ row }: { row: RecordRow }) {
  const text = recordStatusLabel(row.type, row.status);
  if (row.status === "in_progress") return <span className="rounded-md bg-accent-soft px-1.5 py-px text-xs font-semibold text-accent">{text}</span>;
  return <span className={row.status === "done" ? "text-muted" : "text-app"}>{text}</span>;
}

function DueCell({ row }: { row: RecordRow }) {
  if (!row.dueAt) return <Dash />;
  const today = todayDay();
  const late = row.status !== "done" && dueDay(row.dueAt) < today;
  const time = row.dueHasTime ? ` ${dueClockOf(row.dueAt)}` : "";
  return <span className={`tabular-nums ${late ? "font-semibold text-danger" : "text-app"}`}>{dueLabel(row.dueAt, today)}{time}</span>;
}

export const RECORD_COLUMNS: TableColumn<RecordRow>[] = [
  {
    key: "registro",
    header: "Registro",
    wrap: "long",
    cell: (row) => <span className={row.status === "done" ? "text-muted line-through" : ""}>{row.body}</span>,
    sortValue: (row) => row.body.toLowerCase(),
  },
  { key: "tipo", header: "Tipo", cell: (row) => recordShortName(row.type), sortValue: (row) => row.type },
  { key: "lugar", header: "Lugar", wrap: "short", cell: (row) => placeLabel(row) || <Dash />, sortValue: (row) => placeLabel(row) || "~" },
  { key: "pessoa", header: "Pessoa", cell: (row) => row.memberName ?? <Dash />, sortValue: (row) => row.memberName ?? "~" },
  { key: "prazo", header: "Prazo", cell: (row) => <DueCell row={row} />, sortValue: (row) => row.dueAt ?? "9999" },
  { key: "data", header: "Registrado", cell: (row) => <span className="tabular-nums text-muted">{shortDay(row.occurredAt)}</span>, sortValue: (row) => row.occurredAt },
  { key: "situacao", header: "Situação", cell: (row) => <StatusChip row={row} />, sortValue: (row) => ["in_progress", "open", "done"].indexOf(row.status) },
];

/** Linha no celular: tipo e data em cima, o texto, e embaixo o lugar ou a pessoa com a situação. */
export function recordStacked(row: RecordRow): StackedRow {
  const origin = row.origin !== "inbox" ? ` · ${originLabel(row.origin)}` : "";
  return {
    eyebrow: `${recordShortName(row.type)} · ${shortDay(row.occurredAt)}${origin}`,
    title: <span className={row.status === "done" ? "text-muted line-through" : ""}>{row.body}</span>,
    meta: placeLabel(row) || row.memberName || undefined,
    side: <StatusChip row={row} />,
  };
}
