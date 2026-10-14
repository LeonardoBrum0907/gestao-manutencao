import { GESTOR_TIME_ZONE } from "@manutencao/shared";

// Chamado aberto há mais que isto ganha destaque na faixa Agora.
export const LONG_OPEN_MINUTES = 120;

export type Trend = { diff: number; direction: "up" | "down" | "same" };

/**
 * Minutos inteiros desde o instante (zero se ainda não chegou).
 * @example minutesSince("2026-10-12T13:00:00Z", new Date("2026-10-12T15:30:00Z")) // 150
 */
export function minutesSince(iso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 60000));
}

/**
 * Duração curta para ler de relance: minutos, horas e minutos, ou dias e horas.
 * @example formatDuration(130) // "2 h 10 min"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) {
    const rest = minutes % 60;
    return rest ? `${Math.floor(minutes / 60)} h ${rest} min` : `${minutes / 60} h`;
  }
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  return `${Math.floor(minutes / (24 * 60))} d${hours ? ` ${hours} h` : ""}`;
}

/**
 * Diferença para o período anterior. Sem número anterior não há comparação.
 * @example compareTo(41, 43) // { diff: -2, direction: "down" }
 */
export function compareTo(current: number | null, previous: number | null): Trend | null {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  return { diff, direction: diff > 0 ? "up" : diff < 0 ? "down" : "same" };
}

/**
 * "05/10" a partir de "2026-10-05" (a segunda-feira da semana).
 * @example weekLabel("2026-10-05") // "05/10"
 */
export function weekLabel(weekStart: string): string {
  const [, month, day] = weekStart.split("-");
  return `${day}/${month}`;
}

/**
 * Largura da barra em % do maior valor; zero quando não há nada.
 * @example barShare(3, 12) // 25
 */
export function barShare(value: number, max: number): number {
  return max > 0 ? Math.round((value / max) * 1000) / 10 : 0;
}

const dayMonth = new Intl.DateTimeFormat("pt-BR", { timeZone: GESTOR_TIME_ZONE, day: "2-digit", month: "2-digit" });

/**
 * Dia e mês no fuso do gestor.
 * @example shortDate("2026-10-08T15:00:00Z") // "08/10"
 */
export function shortDate(iso: string): string {
  return dayMonth.format(new Date(iso));
}

/**
 * Topo redondo para o eixo de um gráfico (1, 2, 5, 10, 20, 50…), nunca menor que o maior valor.
 * @example niceCeiling(13) // 20
 */
export function niceCeiling(max: number): number {
  if (max <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 5, 10].find((factor) => factor * power >= max) ?? 10;
  return step * power;
}

/**
 * Marcas do eixo vertical de um gráfico com topo `top`: zero, o meio e o topo.
 * @example axisTicks(10) // [0, 5, 10]
 */
export function axisTicks(top: number): number[] {
  return [0, top / 2, top];
}
