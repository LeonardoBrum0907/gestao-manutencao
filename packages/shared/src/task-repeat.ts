// Tarefa que se repete (como no Todoist): ao concluir, nasce a próxima na data seguinte da regra.
// A API usa estas regras para achar o prazo da próxima; a tela, para escrever o rótulo e mostrar as próximas
// datas na Agenda. Os dias são "AAAA-MM-DD" no fuso do gestor; dia da semana 0 = domingo … 6 = sábado.

export const TASK_REPEAT_KINDS = ["day", "workday", "week", "month"] as const;
export type TaskRepeatKind = (typeof TASK_REPEAT_KINDS)[number];

export type TaskRepeat =
  | { every: "day" }
  | { every: "workday" }
  // since: o dia em que a série começou; a cada 2 semanas conta as semanas a partir dele.
  | { every: "week"; interval: 1 | 2; weekdays: number[]; since: string }
  // Mês sem esse dia (31 em novembro) cai no último dia do mês.
  | { every: "month"; dayOfMonth: number };

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
// Mais que isso sem achar um dia é regra quebrada: nenhuma regra válida passa de 62 dias.
const MAX_SEARCH_DAYS = 400;

function utcOf(day: string): Date {
  return new Date(`${day}T12:00:00Z`);
}

function plusDays(day: string, count: number): string {
  return new Date(utcOf(day).getTime() + count * DAY_MS).toISOString().slice(0, 10);
}

function weekdayOf(day: string): number {
  return utcOf(day).getUTCDay();
}

// Segunda-feira da semana do dia: a semana da fábrica começa na segunda.
function mondayOf(day: string): string {
  return plusDays(day, -((weekdayOf(day) + 6) % 7));
}

function lastDayOfMonth(day: string): number {
  const date = utcOf(day);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

function weeksApart(from: string, to: string): number {
  return Math.round((utcOf(mondayOf(to)).getTime() - utcOf(mondayOf(from)).getTime()) / (7 * DAY_MS));
}

/**
 * Se a regra cai neste dia.
 * @example repeatFallsOn({ every: "workday" }, "2026-11-02") // true (segunda)
 */
export function repeatFallsOn(rule: TaskRepeat, day: string): boolean {
  if (rule.every === "day") return true;
  if (rule.every === "workday") return weekdayOf(day) >= 1 && weekdayOf(day) <= 5;
  if (rule.every === "month") return Number(day.slice(8)) === Math.min(rule.dayOfMonth, lastDayOfMonth(day));
  if (!rule.weekdays.includes(weekdayOf(day))) return false;
  return rule.interval === 1 || weeksApart(rule.since, day) % rule.interval === 0;
}

/**
 * O primeiro dia da regra depois de `after` (sem contar ele).
 * @example repeatDayAfter({ every: "week", interval: 1, weekdays: [1], since: "2026-11-02" }, "2026-11-02") // "2026-11-09"
 */
export function repeatDayAfter(rule: TaskRepeat, after: string): string {
  for (let step = 1; step <= MAX_SEARCH_DAYS; step += 1) {
    const day = plusDays(after, step);
    if (repeatFallsOn(rule, day)) return day;
  }
  throw new Error(`Repetição sem dia nos próximos ${MAX_SEARCH_DAYS} dias: ${JSON.stringify(rule)}.`);
}

/**
 * Prazo da próxima tarefa ao concluir esta. Concluída no prazo ou adiantada, vem a data seguinte ao prazo;
 * atrasada, vem a seguinte a hoje, para não nascer outra já atrasada. Sem prazo, conta a partir de hoje.
 * @example nextRepeatDay(toda segunda, "2026-10-26", "2026-10-29") // "2026-11-02"
 */
export function nextRepeatDay(rule: TaskRepeat, dueDay: string | null, today: string): string {
  const base = dueDay && dueDay > today ? dueDay : today;
  return repeatDayAfter(rule, base);
}

/**
 * Os dias da regra depois de `after`, dentro de [from, to]: as próximas vezes que a Agenda mostra apagadas.
 * @example repeatDaysBetween(todo dia, "2026-11-02", "2026-11-01", "2026-11-04") // ["2026-11-03", "2026-11-04"]
 */
export function repeatDaysBetween(rule: TaskRepeat, after: string, from: string, to: string): string[] {
  const days: string[] = [];
  let day = after < from ? plusDays(from, -1) : after;
  for (day = repeatDayAfter(rule, day); day <= to; day = repeatDayAfter(rule, day)) days.push(day);
  return days;
}

/**
 * Lê a regra que veio do banco ou do pedido; nulo quando não é uma regra válida.
 * @example readTaskRepeat({ every: "month", dayOfMonth: 5 }) // { every: "month", dayOfMonth: 5 }
 */
export function readTaskRepeat(value: unknown): TaskRepeat | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (raw.every === "day" || raw.every === "workday") return { every: raw.every };
  if (raw.every === "month") return readMonth(raw.dayOfMonth);
  if (raw.every === "week") return readWeek(raw);
  return null;
}

function readMonth(dayOfMonth: unknown): TaskRepeat | null {
  if (!Number.isInteger(dayOfMonth) || (dayOfMonth as number) < 1 || (dayOfMonth as number) > 31) return null;
  return { every: "month", dayOfMonth: dayOfMonth as number };
}

function readWeek(raw: Record<string, unknown>): TaskRepeat | null {
  const interval = raw.interval === 2 ? 2 : raw.interval === 1 ? 1 : null;
  const weekdays = Array.isArray(raw.weekdays) ? raw.weekdays : [];
  const valid = weekdays.length > 0 && weekdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  if (!interval || !valid || typeof raw.since !== "string" || !DAY_PATTERN.test(raw.since)) return null;
  const sorted = [...new Set(weekdays as number[])].sort((a, b) => a - b);
  return { every: "week", interval, weekdays: sorted, since: raw.since };
}

const WEEKDAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function weekLabel(rule: Extract<TaskRepeat, { every: "week" }>): string {
  const days = rule.weekdays.length === 1 ? WEEKDAY_NAMES[rule.weekdays[0]] : listLabel(rule.weekdays.map((day) => WEEKDAY_SHORT[day]));
  if (rule.interval === 2) return `A cada 2 semanas: ${days}`;
  const every = rule.weekdays.length === 1 && (rule.weekdays[0] === 0 || rule.weekdays[0] === 6) ? "Todo" : "Toda";
  return `${every} ${days}`;
}

function listLabel(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

/**
 * Rótulo curto da regra para a ficha e o checklist.
 * @example taskRepeatLabel({ every: "week", interval: 1, weekdays: [1, 3], since: "2026-11-02" }) // "Toda seg e qua"
 */
export function taskRepeatLabel(rule: TaskRepeat): string {
  if (rule.every === "day") return "Todo dia";
  if (rule.every === "workday") return "Dias úteis (seg a sex)";
  if (rule.every === "month") return `Todo dia ${rule.dayOfMonth} do mês`;
  return weekLabel(rule);
}
