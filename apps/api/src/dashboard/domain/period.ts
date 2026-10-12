import { GESTOR_TIME_ZONE } from "@manutencao/shared";
import { calendarDay, startOfDay } from "../../registro/domain/follow-up";

export type PeriodRange = { from: Date; previousFrom: Date; to: Date };

/**
 * Soma dias a uma data "AAAA-MM-DD" do calendário (negativo volta).
 * @example addDays("2026-10-12", -6) // "2026-10-06"
 */
export function addDays(day: string, amount: number): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + amount)).toISOString().slice(0, 10);
}

/**
 * Últimos N dias contando hoje, e os N dias antes deles para comparar. Dias no fuso do gestor.
 * @example periodRange(7, agora) // { from: início de 6 dias atrás, previousFrom: início de 13 dias atrás, to: agora }
 */
export function periodRange(days: number, now: Date, timeZone: string = GESTOR_TIME_ZONE): PeriodRange {
  const first = addDays(calendarDay(now, timeZone), -(days - 1));
  return { from: startOfDay(first, timeZone), previousFrom: startOfDay(addDays(first, -days), timeZone), to: now };
}

/**
 * Segunda-feira da semana do instante, no fuso do gestor.
 * @example weekOf(new Date("2026-10-12T15:00:00Z")) // "2026-10-12" (é segunda)
 */
export function weekOf(instant: Date, timeZone: string = GESTOR_TIME_ZONE): string {
  const day = calendarDay(instant, timeZone);
  const weekday = (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
  return addDays(day, -weekday);
}

/**
 * As últimas `count` semanas até a atual, da mais antiga para a mais nova.
 * @example weekStarts(agora, 2) // ["2026-10-05", "2026-10-12"]
 */
export function weekStarts(now: Date, count: number, timeZone: string = GESTOR_TIME_ZONE): string[] {
  const current = weekOf(now, timeZone);
  return Array.from({ length: count }, (_, index) => addDays(current, -7 * (count - 1 - index)));
}

/**
 * Conta instantes por semana, só nas semanas pedidas (o que cai fora é ignorado).
 * @example countByWeek([segunda, terça], ["2026-10-12"]) // Map { "2026-10-12" => 2 }
 */
export function countByWeek(instants: readonly Date[], weeks: readonly string[]): Map<string, number> {
  const counts = new Map(weeks.map((week) => [week, 0]));
  for (const instant of instants) {
    const week = weekOf(instant);
    const current = counts.get(week);
    if (current !== undefined) counts.set(week, current + 1);
  }
  return counts;
}
