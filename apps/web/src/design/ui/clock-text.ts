// Regras do seletor de horário próprio (time-input.tsx): ler o que a pessoa digita e montar "HH:MM".

/** Horas da grade do seletor, "00" a "23". */
export const CLOCK_HOURS: string[] = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));

/** Minutos da grade, de 5 em 5. Outro minuto (14:32) se digita no campo de texto. */
export const CLOCK_MINUTES: string[] = Array.from({ length: 12 }, (_, step) => String(step * 5).padStart(2, "0"));

const TYPED = /^(\d{1,2})(?:[:h.](\d{2})?)?$/i;

function joinClock(hour: number, minute: number): string | null {
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// Só números: "9" e "14" são horas cheias; "930" e "1430" trazem os minutos no fim.
function digitsClock(digits: string): string | null {
  if (digits.length <= 2) return joinClock(Number(digits), 0);
  if (digits.length > 4) return null;
  return joinClock(Number(digits.slice(0, -2)), Number(digits.slice(-2)));
}

/**
 * Lê o horário digitado do jeito que se fala na fábrica e devolve "HH:MM", ou null se não der.
 * Aceita "14:30", "14h30", "14h", "14.30", "1430", "930", "9" e "14".
 * Ex.: `parseClock("930")` → `"09:30"`; `parseClock("25")` → `null`.
 */
export function parseClock(text: string): string | null {
  const typed = text.trim().replace(/\s+/g, "");
  if (/^\d+$/.test(typed)) return digitsClock(typed);
  const parts = TYPED.exec(typed);
  if (!parts) return null;
  return joinClock(Number(parts[1]), Number(parts[2] ?? 0));
}

/** Hora de um "HH:MM" ("" quando vazio). Ex.: `clockHour("14:30")` → `"14"`. */
export function clockHour(clock: string): string {
  return clock.slice(0, 2);
}

/** Minuto de um "HH:MM" ("" quando vazio). Ex.: `clockMinute("14:30")` → `"30"`. */
export function clockMinute(clock: string): string {
  return clock.slice(3, 5);
}

/**
 * Escolher a hora mantém o minuto que já estava; sem horário, começa na hora cheia.
 * Ex.: `withClockHour("14:30", "08")` → `"08:30"`; `withClockHour("", "08")` → `"08:00"`.
 */
export function withClockHour(clock: string, hour: string): string {
  return `${hour}:${clockMinute(clock) || "00"}`;
}

/**
 * Escolher o minuto mantém a hora; sem hora ainda, não há horário para mudar.
 * Ex.: `withClockMinute("14:30", "45")` → `"14:45"`; `withClockMinute("", "45")` → `""`.
 */
export function withClockMinute(clock: string, minute: string): string {
  if (!clock) return "";
  return `${clockHour(clock)}:${minute}`;
}
