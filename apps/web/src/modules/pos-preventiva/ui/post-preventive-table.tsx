import type { PostPreventiveDto } from "@manutencao/shared";
import type { StackedRow, TableColumn } from "../../../design/ui/data-table";
import { formatDay } from "../../colaborador/model/pdi-items";
import { AttentionChip } from "./AttentionChip";

// Uma ficha da lista com os nomes que vêm dos cadastros.
export type PostPreventiveTableRow = { item: PostPreventiveDto; place: string; subassembly: string; technicians: string };

/**
 * Colunas da tela Pós-preventiva; a linha e a máquina vão na faixa do grupo.
 * @example <DataTable columns={POST_PREVENTIVE_COLUMNS} groupBy={(row) => ({ key: row.item.machineId, title: row.place })} ... />
 */
export const POST_PREVENTIVE_COLUMNS: TableColumn<PostPreventiveTableRow>[] = [
  { key: "date", header: "Preventiva", cell: (row) => formatDay(row.item.preventiveDate), sortValue: (row) => row.item.preventiveDate },
  { key: "subassembly", header: "Subconjunto", cell: (row) => row.subassembly, sortValue: (row) => row.subassembly },
  { key: "occurrence", header: "Ocorrência", cell: (row) => <span title={row.item.occurrence}>{row.item.occurrence}</span>, wrap: "long" },
  { key: "attention", header: "Ponto de atenção", cell: (row) => <span title={row.item.attentionPoint}>{row.item.attentionPoint}</span>, wrap: "long" },
  { key: "technicians", header: "Técnicos", cell: (row) => row.technicians || "—", sortValue: (row) => row.technicians, wrap: "short" },
  { key: "active", header: "Ponto", cell: (row) => <AttentionChip active={row.item.attentionActive} />, sortValue: (row) => (row.item.attentionActive ? 0 : 1) },
];

/**
 * A ficha no celular: data e subconjunto em cima, a ocorrência no meio e o ponto de atenção embaixo.
 * @example stacked={postPreventiveStacked}
 */
export function postPreventiveStacked(row: PostPreventiveTableRow): StackedRow {
  return {
    eyebrow: `${formatDay(row.item.preventiveDate)} · ${row.subassembly}`,
    title: <span className="line-clamp-2 font-normal">{row.item.occurrence}</span>,
    meta: <span className="line-clamp-2">Atenção: {row.item.attentionPoint}</span>,
    side: <AttentionChip active={row.item.attentionActive} />,
  };
}
