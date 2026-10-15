import { GESTOR_TIME_ZONE } from "@manutencao/shared";
import { dueAtOf, dueDay } from "./board";

/** Prazo como a ficha da tarefa grava: o instante e se o horário foi escolhido. */
export type DueValue = { dueAt: string | null; dueHasTime: boolean };

const clockFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: GESTOR_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Horário do prazo em Brasília, "HH:MM". Ex.: `dueClockOf("2026-10-16T17:30:00.000Z")` → `"14:30"`. */
export function dueClockOf(dueAt: string): string {
  return clockFormat.format(new Date(dueAt));
}

/**
 * Prazo num dia e horário de Brasília (sem horário de verão desde 2019, então -03:00 fixo, como dueAtOf).
 * Ex.: `dueAtWithClock("2026-10-16", "14:30")` → `"2026-10-16T17:30:00.000Z"`.
 */
export function dueAtWithClock(day: string, time: string): string {
  if (!CLOCK.test(time)) throw new Error(`Horário "${time}" fora do formato HH:MM (00:00 a 23:59).`);
  return new Date(`${day}T${time}:00-03:00`).toISOString();
}

/**
 * Trocar o dia mantém o horário que o prazo tinha; sem dia, some o prazo inteiro.
 * Ex.: `withDueDay({ dueAt: "2026-10-16T17:30:00.000Z", dueHasTime: true }, "2026-10-20")` → 20/10 às 14:30.
 */
export function withDueDay(current: DueValue, day: string | null): DueValue {
  if (!day) return { dueAt: null, dueHasTime: false };
  if (current.dueAt && current.dueHasTime) return { dueAt: dueAtWithClock(day, dueClockOf(current.dueAt)), dueHasTime: true };
  return { dueAt: dueAtOf(day), dueHasTime: false };
}

/**
 * Escolher o horário num prazo que já tem dia; horário vazio volta a valer só o dia.
 * Ex.: `withDueClock({ dueAt: "2026-10-16T15:00:00.000Z", dueHasTime: false }, "08:00")` → 16/10 às 08:00.
 */
export function withDueClock(current: DueValue, time: string): DueValue {
  if (!current.dueAt) return current;
  const day = dueDay(current.dueAt);
  if (!time) return { dueAt: dueAtOf(day), dueHasTime: false };
  return { dueAt: dueAtWithClock(day, time), dueHasTime: true };
}
