import {
  BEFORE_OPTIONS_DAY_ONLY,
  BEFORE_OPTIONS_TIMED,
  MINUTES_PER_DAY,
  beforeLabel,
  reminderFireAt,
  type ReminderDue,
  type ReminderRule,
  type TaskReminderBody,
  type TaskReminderDto,
} from "@manutencao/shared";
import { nextDay } from "./board";
import { dueAtWithClock } from "./due-time";

// Atalhos do "+ Lembrete" (opção A do brainstorm de 2026-10-29): um toque grava, e cada linha já diz quando toca.

/** Um atalho da lista: o que grava, quando toca e se a tarefa já tem esse lembrete. */
export type ReminderPreset = {
  key: string;
  label: string;
  body: TaskReminderBody;
  fireAt: Date;
  // Lembrete já gravado igual a este atalho: tocar de novo tira.
  savedId: string | null;
  // Já passou e não está gravado: aparece cinza.
  past: boolean;
};

type PresetDraft = Pick<ReminderPreset, "key" | "label" | "body">;

const MINUTE_MS = 60 * 1000;

function dayOnlyLabel(minutesBefore: number): string {
  return minutesBefore === 0 ? beforeLabel(0, false) : "Na véspera às 7h";
}

// "Na hora" curto: na coluna estreita da ficha, "Na hora do prazo" quebrava em duas linhas ao lado da hora.
function timedLabel(minutesBefore: number): string {
  return minutesBefore === 0 ? "Na hora" : beforeLabel(minutesBefore, true);
}

function beforeDrafts(due: ReminderDue): PresetDraft[] {
  const minutes = due.dueHasTime ? BEFORE_OPTIONS_TIMED : BEFORE_OPTIONS_DAY_ONLY;
  return minutes.map((minutesBefore) => ({
    key: `before-${minutesBefore}`,
    label: due.dueHasTime ? timedLabel(minutesBefore) : dayOnlyLabel(minutesBefore),
    body: { kind: "before", minutesBefore },
  }));
}

// Sem prazo não há "antes": sugere horas fixas perto, como o Todoist faz.
function fixedDrafts(now: Date, today: string): PresetDraft[] {
  const inOneHour = new Date(Math.ceil(now.getTime() / MINUTE_MS) * MINUTE_MS + 60 * MINUTE_MS);
  const tomorrow = nextDay(today);
  return [
    { key: "in-1h", label: "Daqui a 1 h", body: { kind: "at", at: inOneHour.toISOString() } },
    { key: "tomorrow-7", label: "Amanhã cedo", body: { kind: "at", at: dueAtWithClock(tomorrow, "07:00") } },
    { key: "tomorrow-13", label: "Amanhã à tarde", body: { kind: "at", at: dueAtWithClock(tomorrow, "13:00") } },
  ];
}

function sameRule(saved: TaskReminderDto, body: TaskReminderBody, due: ReminderDue): boolean {
  if (body.kind === "at") return saved.kind === "at" && saved.at !== null && new Date(saved.at).getTime() === new Date(body.at).getTime();
  if (saved.kind !== "before" || saved.minutesBefore === null) return false;
  // Prazo só com dia conta em dias: 60 min antes e "no dia" tocam juntos às 7h.
  if (!due.dueHasTime) return Math.floor(saved.minutesBefore / MINUTES_PER_DAY) === Math.floor(body.minutesBefore / MINUTES_PER_DAY);
  return saved.minutesBefore === body.minutesBefore;
}

function bodyRule(body: TaskReminderBody): ReminderRule {
  return body.kind === "at" ? { kind: body.kind, at: body.at, minutesBefore: null } : { kind: body.kind, at: null, minutesBefore: body.minutesBefore };
}

/**
 * Atalhos de lembrete para a tarefa: antes do prazo quando ela tem prazo; horas fixas quando não tem.
 * Ex.: `reminderPresets({ dueAt: "2026-10-30T17:30:00.000Z", dueHasTime: true }, [], now, "2026-10-28")[3]`
 * → `{ label: "1 h antes", fireAt: 30/10 16:30Z, savedId: null, past: false, … }`
 */
export function reminderPresets(due: ReminderDue, saved: TaskReminderDto[], now: Date, today: string): ReminderPreset[] {
  const drafts = due.dueAt === null ? fixedDrafts(now, today) : beforeDrafts(due);
  return drafts.map((draft) => {
    const fireAt = reminderFireAt(bodyRule(draft.body), due) ?? now;
    const savedId = saved.find((reminder) => sameRule(reminder, draft.body, due))?.id ?? null;
    return { ...draft, fireAt, savedId, past: savedId === null && fireAt.getTime() <= now.getTime() };
  });
}

/**
 * Linha de ajuda embaixo dos atalhos: explica as 7h ou o que aparece com prazo.
 * Ex.: `presetNote({ dueAt: null, dueHasTime: false })` → `"Com prazo, aparecem opções antes do prazo."`
 */
export function presetNote(due: ReminderDue): string | null {
  if (due.dueAt === null) return "Com prazo, aparecem opções antes do prazo.";
  return due.dueHasTime ? null : "Às 7h porque o prazo não tem horário.";
}
