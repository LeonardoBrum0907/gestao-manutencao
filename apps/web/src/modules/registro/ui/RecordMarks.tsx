import type { RecordDto } from "@manutencao/shared";
import { dueTone, formatDueDay } from "../model/follow-up";
import { priorityLabel } from "../model/record";

export function DueMark({ record }: { record: RecordDto }) {
  if (record.type !== "task" || !record.dueAt) return <span className="text-muted">—</span>;
  const label = formatDueDay(record.dueAt);
  const tone = dueTone(record.dueAt);
  if (tone === "overdue") return <span className="font-semibold text-danger">{label}</span>;
  if (tone === "today") {
    return <span className="rounded-control bg-accent-soft px-2 py-1 font-semibold text-app">{label}</span>;
  }
  return <span className="text-muted">{label}</span>;
}

export function PriorityMark({ record }: { record: RecordDto }) {
  if (record.type !== "task" || !record.priority) return null;
  if (record.priority === "high") {
    return (
      <span className="mt-1 flex w-fit rounded-control bg-chip px-2 py-1 text-xs font-semibold text-app">Alta</span>
    );
  }
  return <p className="mt-1 text-xs text-muted">{priorityLabel(record.priority)}</p>;
}
