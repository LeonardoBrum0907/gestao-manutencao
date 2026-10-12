import type {
  BoardDto,
  FeedbackBoardDto,
  FeedbackTone,
  ProblemBoardDto,
  RecordPriority,
  RecordStatus,
  RecordType,
} from "@manutencao/shared";
import { machineTitle } from "./problem-board";

// Entrada: o que foi registrado por ela (tarefa, problema ou feedback) e ainda não foi concluído.
export type InboxItem = {
  id: string;
  type: RecordType;
  body: string;
  status: RecordStatus;
  occurredAt: string;
  priority: RecordPriority | null;
  dueAt: string | null;
  // Problema: "MED 03 · Encartuchadeira › Esteira"; feedback: o colaborador.
  where: string | null;
  tone: FeedbackTone | null;
};

function blankItem(id: string, type: RecordType, body: string, status: RecordStatus, occurredAt: string): InboxItem {
  return { id, type, body, status, occurredAt, priority: null, dueAt: null, where: null, tone: null };
}

function taskItems(board: BoardDto): InboxItem[] {
  return board.items
    .filter((item) => item.origin === "inbox" && item.status !== "done")
    .map((item) => ({ ...blankItem(item.id, "task", item.body, item.status, item.occurredAt), priority: item.priority, dueAt: item.dueAt }));
}

function problemItems(board: ProblemBoardDto): InboxItem[] {
  return board.items
    .filter((item) => item.origin === "inbox" && item.status !== "done")
    .map((item) => {
      const where = [machineTitle(item) ?? item.lineName, item.subassemblyName].filter(Boolean).join(" › ") || null;
      return { ...blankItem(item.id, "problem", item.body, item.status, item.occurredAt), where };
    });
}

// Todo feedback nasce na Entrada (não há outra origem), então não há o que filtrar além do status.
function feedbackItems(board: FeedbackBoardDto): InboxItem[] {
  return board.items
    .filter((item) => item.status !== "done")
    .map((item) => ({ ...blankItem(item.id, "feedback", item.body, item.status, item.occurredAt), where: item.memberName, tone: item.tone }));
}

/**
 * Junta os três checklists numa lista só, do mais antigo para o mais novo (o novo aparece logo acima do cartão de adicionar).
 * Ex.: `inboxItems(tasks.data, problems.data, feedbacks.data)`
 */
export function inboxItems(tasks: BoardDto, problems: ProblemBoardDto, feedbacks: FeedbackBoardDto): InboxItem[] {
  const all = [...taskItems(tasks), ...problemItems(problems), ...feedbackItems(feedbacks)];
  return all.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id));
}
