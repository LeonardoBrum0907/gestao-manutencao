import { isFeedbackTone, isRecordPriority, isRecordStatus, isRecordType, type FeedbackTone, type RecordPriority, type RecordType } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalBoolean, optionalDate, optionalString, readObject, requiredDate, requiredString } from "../../kernel/parse";
import type { CaptureInput, EntrySheetInput, FeedbackSheetInput, ProblemSheetInput, TaskSheetInput } from "../domain/record-state";

function parseTone(source: Record<string, unknown>): FeedbackTone | null {
  const tone = optionalString(source, "tone");
  if (tone === null) return null;
  if (!isFeedbackTone(tone)) throw new DomainError("tone", 400, "Tom inválido.");
  return tone;
}

export function parseCapture(body: unknown): CaptureInput {
  const source = readObject(body);
  const type = requiredString(source, "type", "Escolha o tipo.");
  if (!isRecordType(type)) {
    throw new DomainError("type", 400, "Escolha Entrada, Tarefa, Feedback ou Problema.");
  }
  return {
    type,
    body: requiredString(source, "body", "Escreva o texto do registro."),
    occurredAt: requiredDate(source, "occurredAt", "Informe quando aconteceu."),
    memberId: optionalString(source, "memberId"),
    tone: parseTone(source),
  };
}

/**
 * Tipo pedido na ficha: ausente mantém o atual; outro valor troca o tipo (veja assertRetype).
 * Ex.: `parseSheetType({ type: "problem", body: "…" })` → `"problem"`
 */
export function parseSheetType(body: unknown): RecordType | null {
  const type = optionalString(readObject(body), "type");
  if (type === null) return null;
  if (!isRecordType(type)) throw new DomainError("type", 400, `Tipo "${type}" inválido: use task, problem, feedback ou entry.`);
  return type;
}

export function parseTaskSheet(body: unknown): TaskSheetInput {
  const source = readObject(body);
  const status = requiredString(source, "status", "Escolha o status.");
  if (!isRecordStatus(status)) throw new DomainError("status", 400, "Status inválido.");
  const priorityRaw = optionalString(source, "priority");
  let priority: RecordPriority | null = null;
  if (priorityRaw) {
    if (!isRecordPriority(priorityRaw)) throw new DomainError("priority", 400, "Prioridade inválida.");
    priority = priorityRaw;
  }
  return {
    body: requiredString(source, "body", "Escreva o texto do registro."),
    occurredAt: requiredDate(source, "occurredAt", "Informe quando aconteceu."),
    status,
    memberId: optionalString(source, "memberId"),
    factoryId: optionalString(source, "factoryId"),
    tag: optionalString(source, "tag"),
    line: optionalString(source, "line"),
    priority,
    dueAt: optionalDate(source, "dueAt"),
    dueHasTime: optionalBoolean(source, "dueHasTime"),
    notes: optionalString(source, "notes"),
  };
}

export function parseFeedbackSheet(body: unknown): FeedbackSheetInput {
  const source = readObject(body);
  return {
    body: requiredString(source, "body", "Escreva o texto do registro."),
    occurredAt: requiredDate(source, "occurredAt", "Informe quando aconteceu."),
    memberId: optionalString(source, "memberId"),
    tone: parseTone(source),
    notes: optionalString(source, "notes"),
  };
}

export function parseProblemSheet(body: unknown): ProblemSheetInput {
  const source = readObject(body);
  return {
    body: requiredString(source, "body", "Escreva o texto do registro."),
    occurredAt: requiredDate(source, "occurredAt", "Informe quando aconteceu."),
    memberId: optionalString(source, "memberId"),
    lineId: optionalString(source, "lineId"),
    lineLabel: optionalString(source, "lineLabel"),
    machineId: optionalString(source, "machineId"),
    subassemblyId: optionalString(source, "subassemblyId"),
    notes: optionalString(source, "notes"),
  };
}

export function parseEntrySheet(body: unknown): EntrySheetInput {
  const source = readObject(body);
  return {
    body: requiredString(source, "body", "Escreva o texto do registro."),
    occurredAt: requiredDate(source, "occurredAt", "Informe quando aconteceu."),
    notes: optionalString(source, "notes"),
  };
}
