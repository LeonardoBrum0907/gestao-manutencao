import { REPEAT_MAX_INTERVAL, type TaskRepeat } from "@manutencao/shared";

// Personalizar… do Repetir: "a cada [N] [dias | semanas | meses]", os dias da semana e até quando.

export const REPEAT_UNITS = ["day", "week", "month"] as const;
export type RepeatUnit = (typeof REPEAT_UNITS)[number];

const UNIT_LABELS: Record<RepeatUnit, [string, string]> = { day: ["dia", "dias"], week: ["semana", "semanas"], month: ["mês", "meses"] };

/** Nome da unidade no singular ou plural. Ex.: `repeatUnitLabel("month", 2)` → `"meses"`. */
export function repeatUnitLabel(unit: RepeatUnit, interval: number): string {
  return UNIT_LABELS[unit][interval === 1 ? 0 : 1];
}

/** A regra aberta em campos, como a janela Personalizar mostra. */
export type CustomRepeat = {
  unit: RepeatUnit;
  interval: number;
  weekdays: number[];
  dayOfMonth: number;
  // Início da série: de onde contam os "a cada N".
  since: string;
  until: string | null;
};

function weekdayOf(day: string): number {
  return new Date(`${day}T12:00:00Z`).getUTCDay();
}

/**
 * Campos da regra gravada; o que ela não tem vem do dia do prazo (`anchor`). Dias úteis viram semana de seg a sex.
 * @example customOfRepeat({ every: "workday" }, "2026-11-04").weekdays // [1, 2, 3, 4, 5]
 */
export function customOfRepeat(rule: TaskRepeat | null, anchor: string): CustomRepeat {
  const base: CustomRepeat = { unit: "week", interval: 1, weekdays: [weekdayOf(anchor)], dayOfMonth: Number(anchor.slice(8)), since: anchor, until: rule?.until ?? null };
  if (!rule) return base;
  if (rule.every === "workday") return { ...base, weekdays: [1, 2, 3, 4, 5] };
  if (rule.every === "week") return { ...base, interval: rule.interval, weekdays: rule.weekdays, since: rule.since };
  const cycle = { ...base, unit: rule.every, interval: rule.interval ?? 1, since: rule.since ?? anchor };
  return rule.every === "month" ? { ...cycle, dayOfMonth: rule.dayOfMonth } : cycle;
}

/** "A cada" dentro do que a API aceita: 1 até o máximo da unidade. Ex.: `clampInterval("week", 99)` → `52`. */
export function clampInterval(unit: RepeatUnit, value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.round(value), 1), REPEAT_MAX_INTERVAL[unit]);
}

/**
 * A regra para gravar a partir dos campos. "A cada 1" de dia e mês sai sem intervalo, como a opção pronta.
 * @example repeatOfCustom({ unit: "day", interval: 3, since: "2026-11-02", until: null, … }) // { every: "day", interval: 3, since: "2026-11-02" }
 */
export function repeatOfCustom(custom: CustomRepeat): TaskRepeat {
  const interval = clampInterval(custom.unit, custom.interval);
  const end = custom.until ? { until: custom.until } : {};
  const cycle = interval > 1 ? { interval, since: custom.since } : {};
  if (custom.unit === "week") return { every: "week", interval, weekdays: custom.weekdays, since: custom.since, ...end };
  if (custom.unit === "day") return { every: "day", ...cycle, ...end };
  return { every: "month", dayOfMonth: custom.dayOfMonth, ...cycle, ...end };
}
