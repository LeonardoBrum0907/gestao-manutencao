// Tarefa que se repete (como no Todoist): ao concluir, nasce a próxima na data seguinte da regra.
// A API usa estas regras para achar o prazo da próxima; a tela, para escrever o rótulo e mostrar as próximas
// datas na Agenda. Os dias são "AAAA-MM-DD" no fuso do gestor; dia da semana 0 = domingo … 6 = sábado.

export const TASK_REPEAT_KINDS = ["day", "workday", "week", "month"] as const;
export type TaskRepeatKind = (typeof TASK_REPEAT_KINDS)[number];

// until: último dia em que ainda nasce tarefa (Personalizar › Termina em). Sem ele, repete para sempre.
type RepeatEnd = { until?: string };

export type TaskRepeat =
  // interval: a cada N dias, contados a partir de since (obrigatório quando N > 1).
  | ({ every: "day"; interval?: number; since?: string } & RepeatEnd)
  | ({ every: "workday" } & RepeatEnd)
  // since: o dia em que a série começou; a cada N semanas conta as semanas a partir dele.
  | ({ every: "week"; interval: number; weekdays: number[]; since: string } & RepeatEnd)
  // Mês sem esse dia (31 em novembro) cai no último dia do mês. A cada N meses conta a partir do mês de since.
  | ({ every: "month"; dayOfMonth: number; interval?: number; since?: string } & RepeatEnd);

/** Maior "a cada N" aceito por unidade: mais que isso é engano de digitação (um ano de cada). */
export const REPEAT_MAX_INTERVAL: Record<"day" | "week" | "month", number> = { day: 365, week: 52, month: 12 };

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
// Mais que isso sem achar um dia é regra quebrada: o maior intervalo válido (12 meses, 52 semanas) cabe aqui.
const MAX_SEARCH_DAYS = 800;

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

function daysApart(from: string, to: string): number {
  return Math.round((utcOf(to).getTime() - utcOf(from).getTime()) / DAY_MS);
}

function monthsApart(from: string, to: string): number {
  return (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 + Number(to.slice(5, 7)) - Number(from.slice(5, 7));
}

// "A cada N": o dia conta quando a distância até o início da série é múltiplo de N (antes do início também).
function onCycle(apart: number, interval: number | undefined): boolean {
  const every = interval ?? 1;
  return every === 1 || ((apart % every) + every) % every === 0;
}

function fallsInMonth(rule: Extract<TaskRepeat, { every: "month" }>, day: string): boolean {
  if (Number(day.slice(8)) !== Math.min(rule.dayOfMonth, lastDayOfMonth(day))) return false;
  return !rule.since || onCycle(monthsApart(rule.since, day), rule.interval);
}

/**
 * Se a regra cai neste dia (sem olhar a data final).
 * @example repeatFallsOn({ every: "workday" }, "2026-11-02") // true (segunda)
 */
export function repeatFallsOn(rule: TaskRepeat, day: string): boolean {
  if (rule.every === "day") return !rule.since || onCycle(daysApart(rule.since, day), rule.interval);
  if (rule.every === "workday") return weekdayOf(day) >= 1 && weekdayOf(day) <= 5;
  if (rule.every === "month") return fallsInMonth(rule, day);
  if (!rule.weekdays.includes(weekdayOf(day))) return false;
  return onCycle(weeksApart(rule.since, day), rule.interval);
}

/**
 * O primeiro dia da regra depois de `after` (sem contar ele); nulo quando passa da data final da série.
 * @example repeatDayAfter({ every: "week", interval: 1, weekdays: [1], since: "2026-11-02" }, "2026-11-02") // "2026-11-09"
 */
export function repeatDayAfter(rule: TaskRepeat, after: string): string | null {
  for (let step = 1; step <= MAX_SEARCH_DAYS; step += 1) {
    const day = plusDays(after, step);
    if (rule.until && day > rule.until) return null;
    if (repeatFallsOn(rule, day)) return day;
  }
  return null;
}

/**
 * Prazo da próxima tarefa ao concluir esta. Concluída no prazo ou adiantada, vem a data seguinte ao prazo;
 * atrasada, vem a seguinte a hoje, para não nascer outra já atrasada. Sem prazo, conta a partir de hoje.
 * Nulo quando a série terminou (passou do "até").
 * @example nextRepeatDay(toda segunda, "2026-10-26", "2026-10-29") // "2026-11-02"
 */
export function nextRepeatDay(rule: TaskRepeat, dueDay: string | null, today: string): string | null {
  const base = dueDay && dueDay > today ? dueDay : today;
  return repeatDayAfter(rule, base);
}

/**
 * Os dias da regra depois de `after`, dentro de [from, to]: as próximas vezes que a Agenda mostra apagadas.
 * @example repeatDaysBetween(todo dia, "2026-11-02", "2026-11-01", "2026-11-04") // ["2026-11-03", "2026-11-04"]
 */
export function repeatDaysBetween(rule: TaskRepeat, after: string, from: string, to: string): string[] {
  const days: string[] = [];
  let day = repeatDayAfter(rule, after < from ? plusDays(from, -1) : after);
  for (; day !== null && day <= to; day = repeatDayAfter(rule, day)) days.push(day);
  return days;
}

function isDay(value: unknown): value is string {
  return typeof value === "string" && DAY_PATTERN.test(value);
}

function readInterval(value: unknown, max: number): number | null {
  if (value === undefined) return 1;
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= max ? (value as number) : null;
}

/**
 * Lê a regra que veio do banco ou do pedido; nulo quando não é uma regra válida. Campos padrão (a cada 1, sem
 * início, sem fim) ficam de fora, para a regra simples continuar igual à gravada antes do Personalizar.
 * @example readTaskRepeat({ every: "month", dayOfMonth: 5 }) // { every: "month", dayOfMonth: 5 }
 */
export function readTaskRepeat(value: unknown): TaskRepeat | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (raw.until !== undefined && raw.until !== null && !isDay(raw.until)) return null;
  const end: RepeatEnd = isDay(raw.until) ? { until: raw.until } : {};
  const rule = readRule(raw);
  return rule ? { ...rule, ...end } : null;
}

function readRule(raw: Record<string, unknown>): TaskRepeat | null {
  if (raw.every === "workday") return { every: "workday" };
  if (raw.every === "week") return readWeek(raw);
  if (raw.every === "day") return readCycle(raw, REPEAT_MAX_INTERVAL.day, { every: "day" });
  if (raw.every !== "month" || !Number.isInteger(raw.dayOfMonth)) return null;
  const dayOfMonth = raw.dayOfMonth as number;
  if (dayOfMonth < 1 || dayOfMonth > 31) return null;
  return readCycle(raw, REPEAT_MAX_INTERVAL.month, { every: "month", dayOfMonth });
}

// Dia e mês: "a cada 1" fica sem intervalo; a cada N precisa do início da série para contar.
function readCycle<T extends Extract<TaskRepeat, { every: "day" | "month" }>>(raw: Record<string, unknown>, max: number, base: T): T | null {
  const interval = readInterval(raw.interval, max);
  if (interval === null) return null;
  if (interval === 1) return base;
  return isDay(raw.since) ? { ...base, interval, since: raw.since } : null;
}

function readWeek(raw: Record<string, unknown>): TaskRepeat | null {
  const interval = readInterval(raw.interval, REPEAT_MAX_INTERVAL.week);
  const weekdays = Array.isArray(raw.weekdays) ? raw.weekdays : [];
  const valid = weekdays.length > 0 && weekdays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  if (!interval || !valid || !isDay(raw.since)) return null;
  const sorted = [...new Set(weekdays as number[])].sort((a, b) => a - b);
  return { every: "week", interval, weekdays: sorted, since: raw.since };
}

const WEEKDAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function weekLabel(rule: Extract<TaskRepeat, { every: "week" }>): string {
  const days = rule.weekdays.length === 1 ? WEEKDAY_NAMES[rule.weekdays[0]] : listLabel(rule.weekdays.map((day) => WEEKDAY_SHORT[day]));
  if (rule.interval > 1) return `A cada ${rule.interval} semanas: ${days}`;
  const every = rule.weekdays.length === 1 && (rule.weekdays[0] === 0 || rule.weekdays[0] === 6) ? "Todo" : "Toda";
  return `${every} ${days}`;
}

function listLabel(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

function cycleLabel(rule: TaskRepeat): string {
  if (rule.every === "workday") return "Dias úteis (seg a sex)";
  if (rule.every === "week") return weekLabel(rule);
  const every = rule.interval ?? 1;
  if (rule.every === "day") return every > 1 ? `A cada ${every} dias` : "Todo dia";
  return every > 1 ? `A cada ${every} meses no dia ${rule.dayOfMonth}` : `Todo dia ${rule.dayOfMonth} do mês`;
}

/**
 * Rótulo curto da regra para a ficha e o checklist, com a data final quando tem.
 * @example taskRepeatLabel({ every: "week", interval: 1, weekdays: [1, 3], since: "2026-11-02", until: "2026-12-18" }) // "Toda seg e qua, até 18/12/2026"
 */
export function taskRepeatLabel(rule: TaskRepeat): string {
  const until = rule.until ? `, até ${rule.until.slice(8)}/${rule.until.slice(5, 7)}/${rule.until.slice(0, 4)}` : "";
  return `${cycleLabel(rule)}${until}`;
}
