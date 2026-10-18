import type { RpListItemDto } from "@manutencao/shared";
import type { StackedRow, TableColumn } from "../../../design/ui/data-table";
import { formatRpDay, rpStatusChipClass, rpStatusLabel } from "../model/rp";

// Um RP da lista com o lugar e os técnicos já resolvidos pelos cadastros.
export type RpTableRow = { rp: RpListItemDto; place: string[]; technicians: string };

// Na tabela o aviso de falha repetida vai embaixo do status; no celular, ao lado.
function StatusCell({ rp, inline = false }: { rp: RpListItemDto; inline?: boolean }) {
  return (
    <span className={`inline-flex gap-1 ${inline ? "flex-row-reverse items-center gap-2" : "flex-col items-start"}`}>
      <span className={rpStatusChipClass(rp.status)}>{rpStatusLabel(rp.status)}</span>
      {rp.repeatedFailure ? <span className="text-xs font-semibold text-danger">Falha repetida</span> : null}
      {rp.source === "public" ? <OriginNote rp={rp} /> : null}
    </span>
  );
}

// RP da página pública: diz a origem e o que falta o coordenador fazer.
function OriginNote({ rp }: { rp: RpListItemDto }) {
  // Recusado na página pública não pede "conferir": o supervisor já decidiu.
  const check = rp.rejected ? "recusado" : rp.checked ? null : "conferir";
  const pending = [check, rp.reviewRequested ? "em revisão" : null].filter(Boolean).join(", ");
  return <span className="text-xs font-semibold text-accent">Página pública{pending ? ` · ${pending}` : ""}</span>;
}

// A linha em cima e a TAG embaixo, para a coluna não esticar com TAGs longas.
function PlaceCell({ place }: { place: string[] }) {
  const [first, ...rest] = place;
  if (!first) return <span className="text-muted">—</span>;
  return (
    <span className="block">
      <span className="block">{first}</span>
      {rest.length ? <span className="block text-xs text-muted">{rest.join(" · ")}</span> : null}
    </span>
  );
}

/**
 * Colunas da tela RP; o problema é a coluna larga e quebra em até duas linhas.
 * @example <DataTable columns={RP_COLUMNS} defaultSort={{ key: "date", direction: "desc" }} ... />
 */
export const RP_COLUMNS: TableColumn<RpTableRow>[] = [
  { key: "date", header: "Data", cell: (row) => formatRpDay(row.rp.occurredAt), sortValue: (row) => row.rp.occurredAt },
  { key: "place", header: "Linha · TAG", cell: (row) => <PlaceCell place={row.place} />, sortValue: (row) => row.place.join(" ") },
  { key: "problem", header: "Problema", cell: (row) => <span title={row.rp.problem}>{row.rp.problem}</span>, wrap: "long" },
  { key: "technicians", header: "Técnico", cell: (row) => row.technicians || <span className="text-muted">Sem técnico</span>, sortValue: (row) => row.technicians, wrap: "short" },
  { key: "status", header: "Status", cell: (row) => <StatusCell rp={row.rp} />, sortValue: (row) => rpStatusLabel(row.rp.status) },
];

/**
 * O RP no celular: data e lugar em cima, o problema no meio e os técnicos embaixo.
 * @example stacked={rpStacked}
 */
export function rpStacked(row: RpTableRow): StackedRow {
  return {
    eyebrow: [formatRpDay(row.rp.occurredAt), ...row.place].join(" · "),
    title: <span className="line-clamp-2 font-normal">{row.rp.problem}</span>,
    meta: row.technicians || "Sem técnico",
    side: <StatusCell rp={row.rp} inline />,
  };
}
