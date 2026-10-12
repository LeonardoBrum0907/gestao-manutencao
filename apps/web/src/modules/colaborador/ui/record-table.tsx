import type { RecordListItemDto } from "@manutencao/shared";
import type { StackedRow, TableColumn } from "../../../design/ui/data-table";
import { formatWhen, originLabel, recordShortName, statusChipClass, statusLabel } from "../../registro/model/record";
import { DueMark } from "../../registro/ui/RecordMarks";

// Tipo e, quando não veio da Entrada, de onde veio (RP, chamado): é o que diz o que o registro é.
function kindText(record: RecordListItemDto): string {
  return record.origin === "inbox" ? recordShortName(record.type) : `${recordShortName(record.type)} · ${originLabel(record.origin)}`;
}

// Feedback não tem status; a coluna fica vazia em vez de mostrar um "Aberto" que não quer dizer nada.
function StatusChip({ record }: { record: RecordListItemDto }) {
  if (record.type === "feedback") return null;
  return <span className={statusChipClass(record.status)}>{statusLabel(record.status)}</span>;
}

/**
 * Registros na ficha do colaborador (em aberto e concluídos): tipo, texto, data, prazo e status.
 * @example <DataTable plain columns={MEMBER_RECORD_COLUMNS} stacked={memberRecordStacked} ... />
 */
export const MEMBER_RECORD_COLUMNS: TableColumn<RecordListItemDto>[] = [
  { key: "kind", header: "Tipo", cell: kindText, sortValue: kindText, className: "text-muted" },
  { key: "body", header: "Registro", cell: (record) => <span title={record.body}>{record.body}</span>, wrap: "long" },
  { key: "when", header: "Quando", cell: (record) => formatWhen(record.occurredAt), sortValue: (record) => record.occurredAt },
  { key: "due", header: "Prazo", cell: (record) => <DueMark record={record} />, sortValue: (record) => (record.type === "task" ? record.dueAt : null) },
  { key: "status", header: "Status", cell: (record) => <StatusChip record={record} />, sortValue: (record) => (record.type === "feedback" ? null : statusLabel(record.status)) },
];

/**
 * O registro no celular: tipo e data em cima, o texto no meio, o status embaixo.
 * @example stacked={memberRecordStacked}
 */
export function memberRecordStacked(record: RecordListItemDto): StackedRow {
  return {
    eyebrow: `${kindText(record)} · ${formatWhen(record.occurredAt)}`,
    title: <span className="line-clamp-2 font-normal">{record.body}</span>,
    meta: record.type === "task" && record.dueAt ? <>Prazo <DueMark record={record} /></> : null,
    side: <StatusChip record={record} />,
  };
}
