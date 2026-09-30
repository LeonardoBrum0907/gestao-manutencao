import {
  DUE_WINDOW_LABELS,
  DUE_WINDOWS,
  GESTOR_TIME_ZONE,
  isDueWindow,
  isRecordStatus,
  isRecordType,
  type DueWindow,
  type RecordStatus,
  type RecordType,
} from "@manutencao/shared";

export type FollowUpQuery = {
  type: RecordType | null;
  status: RecordStatus | null;
  due: DueWindow | null;
};

export const dueChoices = DUE_WINDOWS.map((due) => ({
  due,
  label: DUE_WINDOW_LABELS[due],
}));

export function followUpFromSearch(params: URLSearchParams): FollowUpQuery {
  const type = params.get("type") ?? "";
  const status = params.get("status") ?? "";
  const due = params.get("due") ?? "";
  return {
    type: isRecordType(type) ? type : null,
    status: isRecordStatus(status) ? status : null,
    due: isDueWindow(due) ? due : null,
  };
}

export function followUpSearch(query: FollowUpQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  if (query.due) params.set("due", query.due);
  return params;
}

export function formatDueDay(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: GESTOR_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function prazoApplies(type: RecordType | null): boolean {
  return type === null || type === "task";
}
