import { repeatDaysBetween, repeatDayAfter, taskRepeatLabel, type BoardItemDto, type RecordDto, type TaskRepeat } from "@manutencao/shared";
import { addDays } from "./agenda";
import { dueDay } from "./board";
import { withDueDay } from "./due-time";

// Campo "Repetir" da tarefa: as opções da ficha e as próximas vezes que a Agenda mostra apagadas.

// custom: Personalizar… (a cada N dias, semanas ou meses e até quando), editado em repeat-custom.
export const REPEAT_CHOICES = ["day", "workday", "week", "biweek", "month", "custom"] as const;
export type RepeatChoice = (typeof REPEAT_CHOICES)[number];

const WEEKDAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function weekdayOf(day: string): number {
  return new Date(`${day}T12:00:00Z`).getUTCDay();
}

/**
 * Regra da escolha, a partir do dia do prazo (ou de hoje): "Toda semana" no dia da semana dele, "Todo mês" no dia do mês.
 * @example repeatOfChoice("week", "2026-11-02") // { every: "week", interval: 1, weekdays: [1], since: "2026-11-02" }
 */
export function repeatOfChoice(choice: RepeatChoice, anchor: string): TaskRepeat {
  if (choice === "day" || choice === "workday") return { every: choice };
  if (choice === "month") return { every: "month", dayOfMonth: Number(anchor.slice(8)) };
  return { every: "week", interval: choice === "biweek" ? 2 : 1, weekdays: [weekdayOf(anchor)], since: anchor };
}

/**
 * A escolha que a regra gravada corresponde; com data final ou outro intervalo, é Personalizar.
 * Ex.: `choiceOfRepeat({ every: "week", interval: 2, … })` → `"biweek"`; `choiceOfRepeat({ every: "day", interval: 3, … })` → `"custom"`.
 */
export function choiceOfRepeat(rule: TaskRepeat): RepeatChoice {
  if (rule.until) return "custom";
  if (rule.every === "week") return rule.interval === 1 ? "week" : rule.interval === 2 ? "biweek" : "custom";
  if (rule.every === "workday") return "workday";
  return (rule.interval ?? 1) === 1 ? rule.every : "custom";
}

/**
 * Rótulo de cada opção: a regra gravada fala por si; as outras dizem em que dia vão cair.
 * @example repeatChoiceLabel("week", null, "2026-11-02") // "Toda semana (segunda)"
 */
export function repeatChoiceLabel(choice: RepeatChoice, current: TaskRepeat | null, anchor: string): string {
  // A data final fica no campo Termina do Personalizar: no rótulo da etiqueta não cabe.
  if (current && choiceOfRepeat(current) === choice) return taskRepeatLabel({ ...current, until: undefined });
  if (choice === "custom") return "Personalizar…";
  if (choice === "day") return "Todo dia";
  if (choice === "workday") return "Dias úteis (seg a sex)";
  if (choice === "month") return `Todo mês (dia ${Number(anchor.slice(8))})`;
  const name = WEEKDAY_NAMES[weekdayOf(anchor)];
  return choice === "biweek" ? `A cada 2 semanas (${name})` : `Toda semana (${name})`;
}

/**
 * Liga ou desliga um dia da semana; o último dia que sobrou não sai (semana sem dia não repete).
 * @example toggleWeekday([1], 3) // [1, 3]
 */
export function toggleWeekday(weekdays: readonly number[], weekday: number): number[] {
  const has = weekdays.includes(weekday);
  if (has && weekdays.length === 1) return [...weekdays];
  return has ? weekdays.filter((day) => day !== weekday) : [...weekdays, weekday].sort((a, b) => a - b);
}

/** O que a ficha grava ao mudar a repetição. */
export type RepeatPatch = { repeat: TaskRepeat | null; dueAt?: string | null; dueHasTime?: boolean };

/**
 * Tarefa sem prazo ganha o primeiro dia da regra a partir de hoje, para entrar na Agenda; com prazo, ele fica.
 * @example repeatPatch(semPrazo, { every: "workday" }, "2026-10-31") // prazo na segunda 02/11
 */
export function repeatPatch(record: Pick<RecordDto, "dueAt" | "dueHasTime">, repeat: TaskRepeat | null, today: string): RepeatPatch {
  if (!repeat || record.dueAt) return { repeat };
  // O dia depois de ontem é hoje: entra hoje se a regra cai hoje, e respeita a data final da série.
  const day = repeatDayAfter(repeat, addDays(today, -1));
  return day ? { repeat, ...withDueDay(record, day) } : { repeat };
}

/** Uma próxima vez da tarefa na Agenda: ainda não existe, só mostra onde a série vai cair. */
export type RepeatGhost = { item: BoardItemDto; day: string };

/**
 * As próximas vezes das tarefas abertas que se repetem, nos dias mostrados. Começam depois do prazo, ou de hoje
 * se a tarefa está atrasada, que é onde a próxima nasce ao concluir (nextRepeatDay no shared).
 * @example repeatGhosts(board.items, agendaWeek(today), today)["2026-11-09"] // [{ item: t1, day: "2026-11-09" }]
 */
export function repeatGhosts(items: readonly BoardItemDto[], days: readonly string[], today: string): Record<string, RepeatGhost[]> {
  const ghosts: Record<string, RepeatGhost[]> = {};
  if (days.length === 0) return ghosts;
  for (const item of items) {
    if (item.status === "done" || !item.repeat || !item.dueAt) continue;
    const after = dueDay(item.dueAt) > today ? dueDay(item.dueAt) : today;
    for (const day of repeatDaysBetween(item.repeat, after, days[0], days[days.length - 1])) (ghosts[day] ??= []).push({ item, day });
  }
  return ghosts;
}
