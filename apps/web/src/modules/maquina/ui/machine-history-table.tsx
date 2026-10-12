import type { PostPreventiveDto } from "@manutencao/shared";
import type { StackedRow, TableColumn } from "../../../design/ui/data-table";
import { formatDay } from "../../colaborador/model/pdi-items";
import { AttentionChip } from "../../pos-preventiva/ui/AttentionChip";

// Uma ficha pós-preventiva da máquina, com o nome do subconjunto já resolvido.
export type MachineRecordRow = { item: PostPreventiveDto; subassembly: string };

function DateAndPart({ row }: { row: MachineRecordRow }) {
  return (
    <span className="block">
      <span className="block">{formatDay(row.item.preventiveDate)}</span>
      <span className="block text-xs text-muted">{row.subassembly}</span>
    </span>
  );
}

const longText = (text: string) => <span title={text}>{text}</span>;

/**
 * Pontos de atenção ativos da tela da máquina; o subconjunto vai na faixa do grupo.
 * @example <DataTable plain columns={ATTENTION_COLUMNS} groupBy={(row) => ({ key: row.item.subassemblyId, title: row.subassembly })} ... />
 */
export const ATTENTION_COLUMNS: TableColumn<MachineRecordRow>[] = [
  { key: "attention", header: "Ponto de atenção", cell: (row) => longText(row.item.attentionPoint), wrap: "long" },
  { key: "occurrence", header: "Ocorrência", cell: (row) => longText(row.item.occurrence), wrap: "long", className: "text-muted" },
  { key: "date", header: "Desde", cell: (row) => formatDay(row.item.preventiveDate), sortValue: (row) => row.item.preventiveDate },
];

/**
 * O ponto de atenção no celular: a preventiva em cima, o ponto no meio e a ocorrência embaixo.
 * @example stacked={attentionStacked}
 */
export function attentionStacked(row: MachineRecordRow): StackedRow {
  return {
    eyebrow: `Preventiva de ${formatDay(row.item.preventiveDate)}`,
    title: row.item.attentionPoint,
    meta: <span className="line-clamp-2">Ocorrência: {row.item.occurrence}</span>,
  };
}

/**
 * Histórico pós-preventiva da tela da máquina, da ficha mais recente para a mais antiga.
 * @example <DataTable plain columns={HISTORY_COLUMNS} defaultSort={{ key: "date", direction: "desc" }} ... />
 */
export const HISTORY_COLUMNS: TableColumn<MachineRecordRow>[] = [
  // Data e subconjunto na mesma célula: a coluna da tela da máquina é estreita e o chip precisa caber.
  { key: "date", header: "Preventiva", cell: (row) => <DateAndPart row={row} />, sortValue: (row) => row.item.preventiveDate },
  { key: "occurrence", header: "Ocorrência", cell: (row) => longText(row.item.occurrence), wrap: "long" },
  { key: "active", header: "Ponto", cell: (row) => <AttentionChip active={row.item.attentionActive} />, sortValue: (row) => (row.item.attentionActive ? 0 : 1) },
];

/**
 * A ficha do histórico no celular: data e subconjunto em cima, a ocorrência no meio e o chip embaixo.
 * @example stacked={historyStacked}
 */
export function historyStacked(row: MachineRecordRow): StackedRow {
  return {
    eyebrow: `${formatDay(row.item.preventiveDate)} · ${row.subassembly}`,
    title: <span className="line-clamp-2 font-normal">{row.item.occurrence}</span>,
    side: <AttentionChip active={row.item.attentionActive} />,
  };
}
