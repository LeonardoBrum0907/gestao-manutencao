import { DomainError } from "../../kernel/domain-error";
import type {
  FeedbackSheetInput,
  ProblemSheetInput,
  RecordState,
  TaskSheetInput,
} from "./record-state";

function requireBody(body: string): string {
  const text = body.trim();
  if (!text) throw new DomainError("empty_body", 400, "Escreva o texto do registro.");
  return text;
}

function assertType(state: RecordState, type: RecordState["type"]): void {
  if (state.type !== type) {
    throw new DomainError("wrong_type", 400, "Esta ficha não é desse tipo.");
  }
}

export function applyTaskSheet(state: RecordState, input: TaskSheetInput): RecordState {
  assertType(state, "task");
  return {
    ...state,
    body: requireBody(input.body),
    occurredAt: input.occurredAt,
    status: input.status,
    memberId: input.memberId,
    factoryId: input.factoryId,
    tag: input.tag,
    line: input.line,
    priority: input.priority,
    dueAt: input.dueAt,
    notes: input.notes,
    lineId: null,
    lineLabel: null,
  };
}

export function applyFeedbackSheet(state: RecordState, input: FeedbackSheetInput): RecordState {
  assertType(state, "feedback");
  return {
    ...state,
    body: requireBody(input.body),
    occurredAt: input.occurredAt,
    memberId: input.memberId,
    factoryId: null,
    lineId: null,
    lineLabel: null,
    tag: null,
    line: null,
    priority: null,
    tone: input.tone,
    dueAt: null,
    notes: null,
  };
}

export function applyProblemSheet(state: RecordState, input: ProblemSheetInput): RecordState {
  assertType(state, "problem");
  const label = input.lineLabel?.trim() ?? "";
  const hasLine = Boolean(input.lineId);
  const hasLabel = label.length > 0;
  if (hasLine && hasLabel) {
    throw new DomainError(
      "line_conflict",
      400,
      "Escolha a linha cadastrada ou descreva outra, não as duas.",
    );
  }
  return {
    ...state,
    body: requireBody(input.body),
    occurredAt: input.occurredAt,
    memberId: input.memberId,
    lineId: hasLine ? input.lineId : null,
    lineLabel: hasLabel ? label : null,
    notes: input.notes,
    factoryId: null,
    tag: null,
    line: null,
    priority: null,
    dueAt: null,
  };
}
