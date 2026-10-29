import { GESTOR_TIME_ZONE } from "@manutencao/shared";

// Regras do seletor de horário próprio (time-input.tsx e time-wheel.tsx): as rodas de hora e minuto,
// no estilo do alarme do celular, que giram sem fim.

/** Horas da roda, "00" a "23". */
export const CLOCK_HOURS: string[] = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));

/** Minutos da roda, "00" a "59". */
export const CLOCK_MINUTES: string[] = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, "0"));

/**
 * Quantas vezes a lista se repete dentro da roda. Ela começa na cópia do meio e, quando para,
 * volta para a cópia do meio na mesma posição: assim parece não ter fim para nenhum dos lados.
 */
export const WHEEL_COPIES = 7;

const MIDDLE_COPY = Math.floor(WHEEL_COPIES / 2);

/** Hora de um "HH:MM" ("" quando vazio). Ex.: `clockHour("14:30")` → `"14"`. */
export function clockHour(clock: string): string {
  return clock.slice(0, 2);
}

/** Minuto de um "HH:MM" ("" quando vazio). Ex.: `clockMinute("14:30")` → `"30"`. */
export function clockMinute(clock: string): string {
  return clock.slice(3, 5);
}

/** Junta hora e minuto. Ex.: `joinClock("08", "05")` → `"08:05"`. */
export function joinClock(hour: string, minute: string): string {
  return `${hour}:${minute}`;
}

const brasiliaClock = new Intl.DateTimeFormat("pt-BR", { timeZone: GESTOR_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/**
 * Onde as rodas começam quando o campo está vazio: agora em Brasília, arredondado para os 5 minutos seguintes.
 * Ex.: `startClock(new Date("2026-10-29T17:32:00Z"))` → `"14:35"`.
 */
export function startClock(now: Date): string {
  const [hour, minute] = brasiliaClock.format(now).split(":").map(Number);
  const total = (hour * 60 + Math.ceil(minute / 5) * 5) % (24 * 60);
  return joinClock(String(Math.floor(total / 60)).padStart(2, "0"), String(total % 60).padStart(2, "0"));
}

function modulo(value: number, base: number): number {
  return ((value % base) + base) % base;
}

/**
 * Rolagem que põe o item `index` no centro da roda, na cópia do meio. `row` é a altura de uma linha.
 * Ex.: `wheelTop(14, 24, 36)` → `(3 * 24 + 14) * 36`.
 */
export function wheelTop(index: number, count: number, row: number): number {
  return (MIDDLE_COPY * count + index) * row;
}

/**
 * Item que está no centro da roda para uma rolagem. Ex.: `wheelIndex(wheelTop(14, 24, 36), 36, 24)` → `14`.
 */
export function wheelIndex(top: number, row: number, count: number): number {
  return modulo(Math.round(top / row), count);
}

/**
 * Mesma posição, trazida para a cópia do meio. Pula um número inteiro de voltas, então o item no centro
 * não muda e o salto não aparece.
 * Ex.: `loopedTop(wheelTop(5, 24, 36) + 2 * 24 * 36, 24, 36)` → `wheelTop(5, 24, 36)`.
 */
export function loopedTop(top: number, count: number, row: number): number {
  const cycle = count * row;
  const middle = MIDDLE_COPY * cycle;
  return middle + modulo(top - middle, cycle);
}

/**
 * Item que os números digitados escolhem na roda focada: "1" e "4" seguidos dão "14"; "7" dá "07".
 * Quando os dois números juntos não existem ("75" nas horas), vale só o último.
 * Ex.: `typedItem("14", CLOCK_HOURS)` → `"14"`; `typedItem("75", CLOCK_HOURS)` → `"05"`.
 */
export function typedItem(typed: string, items: string[]): string | null {
  const recent = typed.slice(-2).padStart(2, "0");
  if (items.includes(recent)) return recent;
  const last = typed.slice(-1).padStart(2, "0");
  return items.includes(last) ? last : null;
}
