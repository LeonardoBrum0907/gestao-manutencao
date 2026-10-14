import type { TransferSummaryDto } from "@manutencao/shared";
import type { StackedRow, TableColumn } from "../../../design/ui/data-table";
import { daysAgoLabel, progressLabel, shortDate, shortName } from "../model/transfer-view";
import { TransferBar } from "./TransferBar";

function percentText(transfer: TransferSummaryDto): string {
  return transfer.progress.percent === null ? "—" : `${transfer.progress.percent}%`;
}

function pairTitle(transfer: TransferSummaryDto): string {
  return `${shortName(transfer.teacher.name)} → ${shortName(transfer.learner.name)}`;
}

function StaleTag() {
  return <span className="ml-2 rounded-full bg-pill-warn px-2 py-0.5 text-xs font-semibold text-pill-warn-text">Parado</span>;
}

// Colunas enxutas (pedido do Léo em 2026-10-12): quem, quanto já passou e se está andando.
export const TRANSFER_COLUMNS: TableColumn<TransferSummaryDto>[] = [
  {
    key: "pair",
    header: "Ensina → aprende",
    sortValue: (transfer) => transfer.learner.name,
    cell: (transfer) => (
      <span>
        <span className="font-medium text-app">{pairTitle(transfer)}</span>
        <span className="block text-xs text-muted">desde {shortDate(transfer.startedAt)}</span>
      </span>
    ),
  },
  {
    key: "progress",
    header: "Repassado",
    sortValue: (transfer) => transfer.progress.percent ?? -1,
    cell: (transfer) => (
      <span className="flex items-center gap-3">
        <TransferBar percent={transfer.progress.percent} />
        <span className="w-10 font-semibold tabular-nums text-app">{percentText(transfer)}</span>
        <span className="text-xs text-muted">{progressLabel(transfer.progress)}</span>
      </span>
    ),
  },
  {
    key: "last",
    header: "Última nota nova",
    sortValue: (transfer) => transfer.lastProgressAt,
    cell: (transfer) => (
      <span className="whitespace-nowrap text-sm text-muted">
        {daysAgoLabel(transfer.lastProgressAt)}
        {transfer.stale ? <StaleTag /> : null}
      </span>
    ),
  },
];

export function transferStacked(transfer: TransferSummaryDto): StackedRow {
  return {
    title: pairTitle(transfer),
    meta: (
      <span>
        {progressLabel(transfer.progress)} · última nota {daysAgoLabel(transfer.lastProgressAt)}
        {transfer.stale ? <StaleTag /> : null}
      </span>
    ),
    side: <span className="font-semibold tabular-nums text-app">{percentText(transfer)}</span>,
  };
}
