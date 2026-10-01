import { isRecordType } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import type { CaptureInput, RecordState } from "./record-state";

export function captureRecord(input: CaptureInput): RecordState {
  const body = input.body.trim();
  if (!body) {
    throw new DomainError("empty_body", 400, "Escreva o texto do registro.");
  }
  if (!isRecordType(input.type)) {
    throw new DomainError("type", 400, "Escolha Tarefa, Feedback ou Problema.");
  }
  if (Number.isNaN(input.occurredAt.getTime())) {
    throw new DomainError("when", 400, "Informe quando aconteceu.");
  }
  return {
    type: input.type,
    body,
    occurredAt: input.occurredAt,
    status: "open",
    technicianId: input.technicianId,
    factoryId: null,
    machineId: null,
    machineLabel: null,
    tag: null,
    line: null,
    priority: null,
    dueAt: null,
    notes: null,
    origin: "inbox",
    dayNumber: null,
    openedAt: null,
    closedAt: null,
    durationMin: null,
    technicianIds: [],
  };
}
