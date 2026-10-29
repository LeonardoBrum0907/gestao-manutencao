import { repeatDaysBetween, repeatDayAfter, repeatFallsOn, taskRepeatLabel, type BoardItemDto, type RecordDto, type TaskRepeat } from "@manutencao/shared";
import { dueDay } from "./board";
import { withDueDay } from "./due-time";

// Campo "Repetir" da tarefa: as opções da ficha e as próximas vezes que a Agenda mostra apagadas.

export const REPEAT_CHOICES = ["day", "workday", "week", "biweek", "month"] as const;
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

/** A escolha que a regra gravada corresponde. Ex.: `choiceOfRepeat({ every: "week", interval: 2, … })` → `"biweek"`. */
export function choiceOfRepeat(rule: TaskRepeat): RepeatChoice {
  if (rule.every !== "week") return rule.every;
  return rule.interval === 2 ? "biweek" : "week";
}

/**
 * Rótulo de cada opção: a regra gravada fala por si; as outras dizem em que dia vão cair.
 * @example repeatChoiceLabel("week", null, "2026-11-02") // "Toda semana (segunda)"
 */
export function repeatChoiceLabel(choice: RepeatChoice, current: TaskRepeat | null, anchor: string): string {
  if (current && choiceOfRepeat(current) === choice) return taskRepeatLabel(current);
  if (choice === "day") return "Todo dia";
  if (choice === "workday") return "Dias úteis (seg a sex)";
  if (choice === "month") return `Todo mês (dia ${Number(anchor.slice(8))})`;
  const name = WEEKDAY_NAMES[weekdayOf(anchor)];
  return choice === "biweek" ? `A cada 2 semanas (${name})` : `Toda semana (${name})`;
}

/**
 * Liga ou desliga um dia na regra semanal; o último dia que sobrou não sai (semana sem dia não repete).
 * @example toggleWeekday({ every: "week", interval: 1, weekdays: [1], since: "2026-11-02" }, 3).weekdays // [1, 3]
 */
export function toggleWeekday(rule: Extract<TaskRepeat, { every: "week" }>, weekday: number): TaskRepeat {
  const has = rule.weekdays.includes(weekday);
  if (has && rule.weekdays.length === 1) return rule;
  const weekdays = has ? rule.weekdays.filter((day) => day !== weekday) : [...rule.weekdays, weekday].sort((a, b) => a - b);
  return { ...rule, weekdays };
}

/** O que a ficha grava ao mudar a repetição. */
export type RepeatPatch = { repeat: TaskRepeat | null; dueAt?: string | null; dueHasTime?: boolean };

/**
 * Tarefa sem prazo ganha o primeiro dia da regra a partir de hoje, para entrar na Agenda; com prazo, ele fica.
 * @example repeatPatch(semPrazo, { every: "workday" }, "2026-10-31") // prazo na segunda 02/11
 */
export function repeatPatch(record: Pick<RecordDto, "dueAt" | "dueHasTime">, repeat: TaskRepeat | null, today: string): RepeatPatch {
  if (!repeat || record.dueAt) return { repeat };
  const day = repeatFallsOn(repeat, today) ? today : repeatDayAfter(repeat, today);
  return { repeat, ...withDueDay(record, day) };
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
