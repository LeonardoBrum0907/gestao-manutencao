import { GESTOR_TIME_ZONE, type BoardGroup, type BoardTarget } from "@manutencao/shared";

// Grupos que recebem tarefa vinda de outro grupo.
export function isDropTarget(group: BoardGroup): group is BoardTarget {
  return group === "today" || group === "upcoming" || group === "undated";
}

const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "long" });
const dayMonth = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "short" });

function utcDay(day: string): Date {
  return new Date(`${day}T12:00:00Z`);
}

function cleanMonth(text: string): string {
  return text.replace(".", "").replace(" de ", " ");
}

// "11 out · Hoje · Domingo", com o dia de hoje que vem do servidor (fuso do gestor).
export function todayTitle(today: string): { title: string; sub: string } {
  const date = utcDay(today);
  const name = weekday.format(date);
  return { title: `${cleanMonth(dayMonth.format(date))} · Hoje`, sub: name.charAt(0).toUpperCase() + name.slice(1) };
}

const dayOf = new Intl.DateTimeFormat("en-CA", { timeZone: GESTOR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

function nextDay(day: string): string {
  const date = utcDay(day);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

// Prazo curto na linha da tarefa: Hoje, Amanhã ou "09 out".
export function dueLabel(dueAt: string, today: string): string {
  const day = dayOf.format(new Date(dueAt));
  if (day === today) return "Hoje";
  if (day === nextDay(today)) return "Amanhã";
  return cleanMonth(dayMonth.format(utcDay(day)));
}

export const groupEmpty: Record<BoardGroup, string> = {
  overdue: "Nada atrasado.",
  today: "Nada para hoje. Arraste uma tarefa para cá.",
  upcoming: "Nada marcado para os próximos dias.",
  undated: "Toda tarefa tem prazo.",
  done: "Nenhuma concluída nos últimos 7 dias.",
};
