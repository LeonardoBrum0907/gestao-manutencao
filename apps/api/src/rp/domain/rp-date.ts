import { GESTOR_TIME_ZONE } from "@manutencao/shared";

// Data do RP como o time escreve no WhatsApp: "18/11/2026", "18/11/26", "18.11.2026", "2026-11-18" e,
// às vezes, só "18/11". Sem ano, vale o ano de hoje (ou o anterior, se a data cairia no futuro) e o gestor é avisado.

/** Dia lido (AAAA-MM-DD) e se o ano foi deduzido porque o texto não trazia. */
export type RpDateRead = { date: string | null; guessedYear: boolean };

const gestorDay = new Intl.DateTimeFormat("en-CA", { timeZone: GESTOR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/**
 * Hoje no fuso do gestor, como AAAA-MM-DD.
 * @example gestorToday(new Date("2026-11-19T01:00:00Z")) // "2026-11-18"
 */
export function gestorToday(now: Date = new Date()): string {
  return gestorDay.format(now);
}

function isoDay(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dayWithoutYear(day: number, month: number, today: string): string | null {
  const year = Number(today.slice(0, 4));
  const date = isoDay(year, month, day);
  return date && date > today ? isoDay(year - 1, month, day) : date;
}

/**
 * Lê a primeira data do texto. "2026-11-18" é ano-mês-dia; o resto é dia/mês/ano, com ano opcional.
 * @example readRpDate("18/11", "2026-11-19") // { date: "2026-11-18", guessedYear: true }
 */
export function readRpDate(text: string, today: string): RpDateRead {
  const yearFirst = /\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b/.exec(text);
  if (yearFirst) return { date: isoDay(Number(yearFirst[1]), Number(yearFirst[2]), Number(yearFirst[3])), guessedYear: false };
  const full = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/.exec(text);
  if (full) {
    const year = Number(full[3]) + (full[3]!.length === 2 ? 2000 : 0);
    return { date: isoDay(year, Number(full[2]), Number(full[1])), guessedYear: false };
  }
  const short = /\b(\d{1,2})[/\-.](\d{1,2})\b/.exec(text);
  if (!short) return { date: null, guessedYear: false };
  const date = dayWithoutYear(Number(short[1]), Number(short[2]), today);
  return { date, guessedYear: date !== null };
}
