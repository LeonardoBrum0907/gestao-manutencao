import type { ProblemWrite } from "../../ports/problem-log";
import type { RecordState } from "./record-state";

export function problemFromShift(write: ProblemWrite): RecordState {
  return {
    type: "problem",
    origin: write.origin,
    body: write.body,
    occurredAt: write.occurredAt,
    status: write.status,
    memberId: null,
    memberIds: write.memberIds,
    factoryId: write.factoryId,
    machineId: write.machineId,
    machineLabel: write.machineLabel,
    tag: null,
    line: write.line,
    priority: null,
    dueAt: null,
    notes: write.notes,
    dayNumber: write.dayNumber,
    openedAt: write.openedAt,
    closedAt: write.closedAt,
    durationMin: write.durationMin,
    tone: null,
  };
}
