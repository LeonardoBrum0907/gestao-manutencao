import {
  RECORD_ORIGIN_LABELS,
  RECORD_PRIORITIES,
  RECORD_PRIORITY_LABELS,
  RECORD_STATUSES,
  RECORD_STATUS_LABELS,
  RECORD_TYPE_LABELS,
  RECORD_TYPES,
  type RecordOrigin,
  type RecordPriority,
  type RecordStatus,
  type RecordType,
} from "@manutencao/shared";

export function recordGestorName(type: RecordType): string {
  return RECORD_TYPE_LABELS[type].gestor;
}

export function recordShortName(type: RecordType): string {
  return RECORD_TYPE_LABELS[type].short;
}

export function originLabel(origin: RecordOrigin): string {
  return RECORD_ORIGIN_LABELS[origin];
}

export function statusLabel(status: RecordStatus): string {
  return RECORD_STATUS_LABELS[status];
}

export function statusChipClass(status: RecordStatus): string {
  if (status === "in_progress") return "rounded-control bg-accent-soft px-2 py-1 text-xs font-semibold text-accent";
  if (status === "done") return "rounded-control bg-chip px-2 py-1 text-xs font-medium text-muted";
  return "rounded-control bg-chip px-2 py-1 text-xs font-semibold text-app";
}

export function priorityLabel(priority: RecordPriority): string {
  return RECORD_PRIORITY_LABELS[priority];
}

export const typeChoices = RECORD_TYPES.map((type) => ({
  type,
  short: RECORD_TYPE_LABELS[type].short,
  gestor: RECORD_TYPE_LABELS[type].gestor,
}));

export const statusOptions = RECORD_STATUSES.map((status) => ({
  value: status,
  label: RECORD_STATUS_LABELS[status],
}));

export const priorityOptions = RECORD_PRIORITIES.map((priority) => ({
  value: priority,
  label: RECORD_PRIORITY_LABELS[priority],
}));

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

export function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

export function nowLocalInput(): string {
  return toLocalInput(new Date().toISOString());
}
