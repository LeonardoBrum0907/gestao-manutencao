import { TECH_CARD_TYPE_LABELS, type TechCardHit } from "@manutencao/shared";
import type { StackedRow, TableColumn } from "../../../design/ui/data-table";
import { sourceLabel } from "../model/tech-card";

// Etiqueta do tipo na lista e na ficha.
export function TypeChip({ card }: { card: Pick<TechCardHit, "type"> }) {
  return <span className="inline-flex rounded-control bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-ink">{TECH_CARD_TYPE_LABELS[card.type].one}</span>;
}

export function ReviewChip() {
  return <span className="inline-flex rounded-control bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">Revisar</span>;
}

function TitleCell({ card }: { card: TechCardHit }) {
  return (
    <span className="block">
      <span className="block font-medium">{card.title}</span>
      {card.summary ? <span className="mt-0.5 block text-xs text-muted">{card.summary}</span> : null}
    </span>
  );
}

function CodeCell({ card }: { card: TechCardHit }) {
  const text = card.code ?? card.deviceTag ?? "—";
  return <span className={`font-mono text-[13px] ${card.exact ? "font-bold text-accent" : ""}`}>{text}</span>;
}

/**
 * Colunas dos resultados da busca; o acerto exato de código vem em negrito e no alto.
 * @example <DataTable columns={TECH_CARD_COLUMNS} rows={hits} rowKey={(row) => row.id} stacked={techCardStacked} />
 */
export const TECH_CARD_COLUMNS: TableColumn<TechCardHit>[] = [
  { key: "type", header: "Tipo", cell: (row) => <TypeChip card={row} />, sortValue: (row) => TECH_CARD_TYPE_LABELS[row.type].one },
  { key: "code", header: "Código / nº", cell: (row) => <CodeCell card={row} />, sortValue: (row) => row.code ?? row.deviceTag ?? "" },
  { key: "title", header: "Título", cell: (row) => <TitleCell card={row} />, wrap: "long", sortValue: (row) => row.title },
  {
    key: "scope",
    header: "Onde",
    cell: (row) => (row.subassemblyName ? `${row.scopeLabel} · ${row.subassemblyName}` : row.scopeLabel),
    sortValue: (row) => row.scopeLabel,
    wrap: "short",
  },
  { key: "source", header: "Fonte", cell: (row) => sourceLabel(row) ?? <span className="text-muted">Sem documento</span>, wrap: "short", className: "text-muted" },
  { key: "review", header: "", cell: (row) => (row.reviewNeeded ? <ReviewChip /> : null) },
];

/**
 * A ficha no celular: tipo e código em cima, título no meio, onde e fonte embaixo.
 * @example stacked={techCardStacked}
 */
export function techCardStacked(row: TechCardHit): StackedRow {
  return {
    eyebrow: `${TECH_CARD_TYPE_LABELS[row.type].one}${row.code ? ` · ${row.code}` : ""}`,
    title: row.title,
    meta: <span className="line-clamp-2">{[row.scopeLabel, sourceLabel(row)].filter(Boolean).join(" · ")}</span>,
    side: row.reviewNeeded ? <ReviewChip /> : null,
  };
}
