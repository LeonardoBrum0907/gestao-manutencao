import type { BoardItemDto } from "@manutencao/shared";
import { dayLabel, dueDay } from "./board";

// Agenda: uma lista por dia a partir de hoje, as atrasadas no topo de hoje e "Sem prazo" no fim.

export const AGENDA_DAYS = 7;
export const OVERDUE_KEY = "atrasadas";
export const UNDATED_KEY = "sem-prazo";
const DAY_PREFIX = "dia:";

/** Chave da lista de um dia. Ex.: `dayKey("2026-10-16")` → `"dia:2026-10-16"`. */
export function dayKey(day: string): string {
  return `${DAY_PREFIX}${day}`;
}

/** O dia de uma chave de lista, ou nulo para Atrasadas e Sem prazo. Ex.: `dayOfKey("dia:2026-10-16")` → `"2026-10-16"`. */
export function dayOfKey(key: string): string | null {
  return key.startsWith(DAY_PREFIX) ? key.slice(DAY_PREFIX.length) : null;
}

/** Soma dias a "AAAA-MM-DD". Ex.: `addDays("2026-10-30", 3)` → `"2026-11-02"`. */
export function addDays(day: string, count: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

/** Os dias de uma semana da Agenda. Ex.: `agendaWeek("2026-10-13")` → `["2026-10-13", …, "2026-10-19"]`. */
export function agendaWeek(start: string, count: number = AGENDA_DAYS): string[] {
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

/**
 * Ids das tarefas abertas por lista, na ordem que vieram do servidor (a ordem guardada ao arrastar).
 * A lista de Atrasadas só existe na semana que começa hoje; prazo fora da semana não aparece.
 * @example agendaLists(board.items, agendaWeek(today), today)["dia:2026-10-14"] // ["t5"]
 */
export function agendaLists(items: readonly BoardItemDto[], days: readonly string[], today: string): Record<string, string[]> {
  const lists: Record<string, string[]> = { [UNDATED_KEY]: [] };
  if (days[0] === today) lists[OVERDUE_KEY] = [];
  for (const day of days) lists[dayKey(day)] = [];
  for (const item of items) {
    if (item.status === "done") continue;
    const key = item.group === "overdue" ? OVERDUE_KEY : item.dueAt ? dayKey(dueDay(item.dueAt)) : UNDATED_KEY;
    lists[key]?.push(item.id);
  }
  return lists;
}

const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "long" });

/**
 * Cabeçalho do dia: data curta e, ao lado, Hoje, Amanhã ou o dia da semana.
 * @example agendaDayTitle("2026-10-15", "2026-10-13") // { date: "15 out", name: "Quinta-feira" }
 */
export function agendaDayTitle(day: string, today: string): { date: string; name: string } {
  const near = dayLabel(day, today);
  const date = dayLabel(day, "0000-01-01");
  if (near !== date) return { date, name: near };
  const name = weekday.format(new Date(`${day}T12:00:00Z`));
  return { date, name: name.charAt(0).toUpperCase() + name.slice(1) };
}

const monthYear = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" });

/**
 * Mês da semana mostrada. Ex.: `agendaMonth(["2026-10-29", …, "2026-11-04"])` → `"Outubro – novembro de 2026"`.
 * Na virada do ano os dois anos aparecem: só "de 2027" no fim fazia o dezembro parecer de 2027.
 * Ex.: `agendaMonth(["2026-12-29", …, "2027-01-04"])` → `"Dezembro de 2026 – janeiro de 2027"`.
 */
export function agendaMonth(days: readonly string[]): string {
  const first = monthYear.format(new Date(`${days[0]}T12:00:00Z`));
  const last = monthYear.format(new Date(`${days[days.length - 1]}T12:00:00Z`));
  const label = first === last ? first : `${sameYear(days) ? first.split(" de ")[0] : first} – ${last}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function sameYear(days: readonly string[]): boolean {
  return days[0].slice(0, 4) === days[days.length - 1].slice(0, 4);
}
