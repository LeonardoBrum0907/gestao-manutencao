import { nextRepeatDay, type RecordPriority, type ReminderRule, type TaskReminderBody, type TaskRepeat } from "@manutencao/shared";
import { dueAtOnDay } from "./agenda-day";
import { calendarDay } from "./follow-up";
import type { RecordState } from "./record-state";

/** A tarefa concluída que tem regra de repetição: o que passa para a próxima. */
export type RepeatSource = {
  body: string;
  memberId: string | null;
  memberIds: string[];
  factoryId: string | null;
  tag: string | null;
  line: string | null;
  priority: RecordPriority | null;
  notes: string | null;
  dueAt: Date | null;
  dueHasTime: boolean;
  repeat: TaskRepeat;
  reminders: ReminderRule[];
};

export type NextTask = { state: RecordState; reminders: TaskReminderBody[] };

/**
 * A próxima tarefa da série: mesmo texto, local, responsável, prioridade e lembretes, aberta, com o prazo no
 * dia seguinte da regra e o mesmo horário. Anexos e o que foi feito ficam só na concluída.
 * @example nextTask(tarefaDeSegunda, new Date("2026-11-02T18:00:00Z")).state.dueAt // segunda 09/11
 */
export function nextTask(source: RepeatSource, now: Date): NextTask {
  const day = nextRepeatDay(source.repeat, source.dueAt ? calendarDay(source.dueAt) : null, calendarDay(now));
  const dueAt = dueAtOnDay(day, source.dueAt);
  return { state: nextState(source, dueAt, now), reminders: shiftReminders(source.reminders, source.dueAt, dueAt) };
}

function nextState(source: RepeatSource, dueAt: Date, now: Date): RecordState {
  return {
    type: "task",
    body: source.body,
    occurredAt: now,
    status: "open",
    memberId: source.memberId,
    factoryId: source.factoryId,
    lineId: null,
    lineLabel: null,
    tag: source.tag,
    line: source.line,
    priority: source.priority,
    tone: null,
    dueAt,
    dueHasTime: source.dueAt !== null && source.dueHasTime,
    notes: source.notes,
    origin: "inbox",
    dayNumber: null,
    openedAt: null,
    closedAt: null,
    durationMin: null,
    memberIds: source.memberIds,
    machineId: null,
    subassemblyId: null,
  };
}

// "Antes do prazo" acompanha o prazo novo sozinho; data e hora fixa anda os mesmos dias que o prazo andou.
// Fixa numa tarefa que não tinha prazo não tem como andar junto e fica só na concluída.
function shiftReminders(rules: ReminderRule[], oldDue: Date | null, newDue: Date): TaskReminderBody[] {
  const shift = oldDue ? newDue.getTime() - oldDue.getTime() : null;
  return rules.flatMap((rule): TaskReminderBody[] => {
    if (rule.kind === "before" && rule.minutesBefore !== null) return [{ kind: "before", minutesBefore: rule.minutesBefore }];
    if (rule.kind === "at" && rule.at && shift !== null) return [{ kind: "at", at: new Date(new Date(rule.at).getTime() + shift).toISOString() }];
    return [];
  });
}
