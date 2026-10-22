// Brasília está em UTC-3 o ano todo desde 2019 (sem horário de verão): 9h em Brasília = 12h UTC.
const BRASILIA_OFFSET_HOURS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Um horário de Brasília, `days` dias antes de `today` (negativo = no futuro).
 * As datas da demonstração são sempre relativas ao dia da carga, para o Meu Dia e o Dashboard terem movimento.
 * @example demoMoment(new Date("2026-10-22T15:00:00Z"), 1, 9, 30).toISOString() // "2026-10-21T12:30:00.000Z"
 */
export function demoMoment(today: Date, days: number, hour: number, minute = 0): Date {
  const day = brasiliaDay(new Date(today.getTime() - days * DAY_MS));
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date, hour + BRASILIA_OFFSET_HOURS, minute));
}

/**
 * O dia (AAAA-MM-DD) em Brasília.
 * @example brasiliaDay(new Date("2026-10-22T02:00:00Z")) // "2026-10-21"
 */
export function brasiliaDay(moment: Date): string {
  return new Date(moment.getTime() - BRASILIA_OFFSET_HOURS * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * O dia em Brasília, `days` dias antes de `today`.
 * @example demoDay(new Date("2026-10-22T15:00:00Z"), -3) // "2026-10-25"
 */
export function demoDay(today: Date, days: number): string {
  return brasiliaDay(demoMoment(today, days, 12));
}
