import type { RecordDto, RecordType } from "@manutencao/shared";
import type { FeedbackSheetBody, ProblemSheetBody, SheetBody, TaskSheetBody } from "../data/records";

// Campos que o modal de registro muda um de cada vez; o resto da ficha vai como está gravado.
export type SheetPatch = Partial<TaskSheetBody & FeedbackSheetBody & ProblemSheetBody>;

type SheetFields = Required<SheetPatch>;

function currentFields(record: RecordDto): SheetFields {
  return {
    body: record.body,
    occurredAt: record.occurredAt,
    status: record.status,
    memberId: record.memberId,
    factoryId: record.factoryId,
    tag: record.tag,
    line: record.line,
    priority: record.priority,
    dueAt: record.dueAt,
    dueHasTime: record.dueHasTime,
    notes: record.notes,
    tone: record.tone,
    lineId: record.lineId,
    lineLabel: record.lineLabel,
    machineId: record.machineId,
    subassemblyId: record.subassemblyId,
  };
}

function taskBody(fields: SheetFields): TaskSheetBody {
  const { body, occurredAt, status, memberId, factoryId, tag, line, priority, dueAt, dueHasTime, notes } = fields;
  return { body, occurredAt, status, memberId, factoryId, tag, line, priority, dueAt, dueHasTime, notes };
}

function feedbackBody(fields: SheetFields): FeedbackSheetBody {
  const { body, occurredAt, memberId, tone, notes } = fields;
  return { body, occurredAt, memberId, tone, notes };
}

function problemBody(fields: SheetFields): ProblemSheetBody {
  const { body, occurredAt, memberId, lineId, lineLabel, machineId, subassemblyId, notes } = fields;
  return { body, occurredAt, memberId, lineId, lineLabel, machineId, subassemblyId, notes };
}

/**
 * Ficha inteira para o PATCH do registro, com o campo mudado por cima do que está gravado. Com outro
 * tipo, vai a ficha do tipo novo e o `type` (a API troca o tipo e limpa o que o tipo novo não usa).
 * Ex.: `sheetBody(record, { priority: "high" })`; `sheetBody(record, {}, "problem")`
 */
export function sheetBody(record: RecordDto, patch: SheetPatch, type: RecordType = record.type): SheetBody {
  const fields: SheetFields = { ...currentFields(record), ...patch };
  const retype = type === record.type ? {} : { type };
  if (type === "task") return { ...taskBody(fields), ...retype };
  if (type === "feedback") return { ...feedbackBody(fields), ...retype };
  return { ...problemBody(fields), ...retype };
}

/** Por que o tipo deste registro não troca (nulo quando troca). Espelha assertRetype da API. */
export function retypeBlock(record: RecordDto): string | null {
  if (record.origin !== "inbox") return "Este registro veio de outra ficha e não troca de tipo.";
  if (record.chamadoId) return "Tarefa gerada de chamado continua tarefa.";
  if (record.attachments.length) return "Só a tarefa guarda anexo: tire os anexos para trocar o tipo.";
  return null;
}
