import { GESTOR_TIME_ZONE, type PushMessage } from "@manutencao/shared";

export type ReminderTask = { id: string; body: string; dueAt: Date | null; dueHasTime: boolean };

// Título da notificação: a primeira linha da tarefa, curta o bastante para caber na barra do Android.
const TITLE_MAX = 80;

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: GESTOR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const shortDay = new Intl.DateTimeFormat("pt-BR", { timeZone: GESTOR_TIME_ZONE, day: "2-digit", month: "2-digit" });
const clock = new Intl.DateTimeFormat("pt-BR", { timeZone: GESTOR_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

function taskTitle(body: string): string {
  const firstLine = body.trim().split("\n")[0] ?? "";
  return firstLine.length > TITLE_MAX ? `${firstLine.slice(0, TITLE_MAX - 1)}…` : firstLine || "Tarefa";
}

function relativeDay(due: Date, now: Date): string {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (dayFormat.format(due) === dayFormat.format(now)) return "hoje";
  if (dayFormat.format(due) === dayFormat.format(tomorrow)) return "amanhã";
  return shortDay.format(due);
}

/**
 * Linha do prazo na notificação, no horário de Brasília.
 * @example dueText({ dueAt: new Date("2026-10-15T17:30:00Z"), dueHasTime: true }, new Date("2026-10-15T12:00:00Z")) // "Prazo hoje às 14:30"
 */
export function dueText(task: Pick<ReminderTask, "dueAt" | "dueHasTime">, now: Date): string {
  if (!task.dueAt) return "Sem prazo";
  const day = relativeDay(task.dueAt, now);
  const time = task.dueHasTime ? ` às ${clock.format(task.dueAt)}` : "";
  const verb = task.dueAt < now ? "Venceu" : "Prazo";
  return `${verb} ${day}${time}`;
}

/**
 * Notificação do lembrete, com Concluir (marca a tarefa como feita) e Adiar 1 h. Tocar abre a ficha da tarefa.
 * @example reminderMessage(task, "rem1", new Date()).tag // "lembrete:<id da tarefa>"
 */
export function reminderMessage(task: ReminderTask, reminderId: string, now: Date): PushMessage {
  return {
    title: taskTitle(task.body),
    body: dueText(task, now),
    url: `/registros/${task.id}`,
    // Um aviso por tarefa: o lembrete seguinte substitui o anterior na barra.
    tag: `lembrete:${task.id}`,
    actions: [
      { action: "complete", title: "Concluir", method: "PATCH", path: `/api/records/${task.id}/board`, body: { status: "done" } },
      { action: "snooze", title: "Adiar 1 h", method: "POST", path: `/api/reminders/${reminderId}/snooze` },
    ],
  };
}
