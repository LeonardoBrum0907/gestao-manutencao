import { GESTOR_TIME_ZONE } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { calendarDay, startOfDay } from "./follow-up";

// Agenda: arrastar uma tarefa para um dia da semana. O dia vem como "AAAA-MM-DD" no fuso do gestor.

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const NOON_MS = 12 * 60 * 60 * 1000;

/**
 * Confere que o texto é um dia de calendário que existe ("2026-02-30" não passa).
 * @example parseDueDay("2026-10-16") // "2026-10-16"
 */
export function parseDueDay(value: unknown): string {
  const match = typeof value === "string" ? DAY_PATTERN.exec(value) : null;
  if (!match) throw new DomainError("day", 400, `Dia inválido: ${JSON.stringify(value)}. Use AAAA-MM-DD.`);
  const [, year, month, date] = match.map(Number);
  const probe = new Date(Date.UTC(year, month - 1, date));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== date) {
    throw new DomainError("day", 400, `Dia inválido: ${value}. Use AAAA-MM-DD.`);
  }
  return value as string;
}

/**
 * Novo prazo ao levar a tarefa para outro dia: mantém o horário que ela tinha; sem prazo antes, fica ao meio-dia.
 * @example dueAtOnDay("2026-10-16", new Date("2026-10-13T18:00:00.000Z")) // 16/10 às 15h em São Paulo
 */
export function dueAtOnDay(day: string, current: Date | null, timeZone: string = GESTOR_TIME_ZONE): Date {
  const timeOfDay = current ? current.getTime() - startOfDay(calendarDay(current, timeZone), timeZone).getTime() : NOON_MS;
  return new Date(startOfDay(day, timeZone).getTime() + timeOfDay);
}
