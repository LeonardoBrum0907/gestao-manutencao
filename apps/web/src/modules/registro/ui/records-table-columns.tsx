import type { StackedRow, TableColumn } from "../../../design/ui/data-table";
import { todayDay } from "../model/board";
import { recordDue, type RecordDue } from "../model/record-due";
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
  const due = recordDue(row, todayDay());
  if (!due) return <Dash />;
  return <span className={`tabular-nums ${due.late ? "font-semibold text-danger" : "text-app"}`}>{due.text}</span>;
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

// No celular não há coluna Prazo: o prazo vai junto do lugar ou da pessoa, em vermelho quando atrasado, como no computador.
function StackedMeta({ place, due }: { place: string | null; due: RecordDue }) {
  return (
    <>
      {place ? `${place} · ` : ""}
      <span className={`tabular-nums ${due.late ? "font-semibold text-danger" : ""}`}>Prazo: {due.text}</span>
    </>
  );
}

/** Linha no celular: tipo e data em cima, o texto, e embaixo o lugar ou a pessoa e o prazo, com a situação. */
export function recordStacked(row: RecordRow): StackedRow {
  const origin = row.origin !== "inbox" ? ` · ${originLabel(row.origin)}` : "";
  const place = placeLabel(row) || row.memberName;
  const due = recordDue(row, todayDay());
  return {
    eyebrow: `${recordShortName(row.type)} · ${shortDay(row.occurredAt)}${origin}`,
    title: <span className={row.status === "done" ? "text-muted line-through" : ""}>{row.body}</span>,
    meta: due ? <StackedMeta place={place} due={due} /> : place || undefined,
    side: <StatusChip row={row} />,
  };
}
