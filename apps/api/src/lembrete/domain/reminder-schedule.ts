import { reminderFireAt, type ReminderKind } from "@manutencao/shared";

/** Lembrete de tarefa aberta, com o prazo dela: o que o relógio precisa para decidir se toca. */
export type ReminderCandidate = {
  id: string;
  kind: ReminderKind;
  at: Date | null;
  minutesBefore: number | null;
  snoozedUntil: Date | null;
  sentFor: Date | null;
  createdAt: Date;
  task: { id: string; body: string; dueAt: Date | null; dueHasTime: boolean };
};

// API parada (PC desligado, deploy) atrasa o toque; passado disso o lembrete perde o sentido e não toca mais.
export const LATE_REMINDER_LIMIT_MS = 3 * 60 * 60 * 1000;
// Folga para quem cria "1 h antes" com o prazo daqui a 1 h exata: o minuto da gravação não conta como passado.
const CREATION_SLACK_MS = 60 * 1000;

/**
 * Hora de tocar contando o "Adiar 1 h": vale o adiamento enquanto ele for depois da hora original.
 * @example effectiveFireAt({ ...candidate, snoozedUntil: new Date("2026-10-16T17:30:00Z") }) // 17:30Z, se a original for antes
 */
export function effectiveFireAt(candidate: ReminderCandidate): Date | null {
  const rule = { kind: candidate.kind, at: candidate.at?.toISOString() ?? null, minutesBefore: candidate.minutesBefore };
  const base = reminderFireAt(rule, candidate.task);
  const snoozed = candidate.snoozedUntil;
  if (!base) return snoozed;
  return snoozed && snoozed > base ? snoozed : base;
}

/**
 * Hora do toque que vence agora, ou nulo. Não toca de novo a mesma hora, nem hora que já tinha passado
 * quando o lembrete foi criado, nem a que passou há mais de LATE_REMINDER_LIMIT_MS.
 * @example dueFireAt(candidate, new Date()) // Date do toque, se for para tocar
 */
export function dueFireAt(candidate: ReminderCandidate, now: Date): Date | null {
  const fireAt = effectiveFireAt(candidate);
  if (!fireAt || fireAt > now) return null;
  if (now.getTime() - fireAt.getTime() > LATE_REMINDER_LIMIT_MS) return null;
  if (fireAt.getTime() < candidate.createdAt.getTime() - CREATION_SLACK_MS) return null;
  if (candidate.sentFor?.getTime() === fireAt.getTime()) return null;
  return fireAt;
}
