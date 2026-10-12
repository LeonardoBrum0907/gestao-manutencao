import { GESTOR_TIME_ZONE, TRANSFER_STALE_DAYS, type MatrixSkillDto, type TransferPointDto } from "@manutencao/shared";
import { progressOf, type ScoreBook, type ScoreState } from "./transfer-progress";

// Linha do tempo do repasse, tirada do histórico das notas de quem aprende (MemberSkillHistory).

/** Uma mudança de nota de quem aprende. */
export type ScoreChange = ScoreState & { skillId: string; changedAt: Date };

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_POINTS = 12;
const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000;
const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: GESTOR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/**
 * Notas como estavam num instante: a última mudança de cada habilidade até ali.
 * @example scoresAt(history, new Date("2026-08-01")).get("s1") // { score: 2, notApplicable: false }
 */
export function scoresAt(history: readonly ScoreChange[], at: Date): ScoreBook {
  const book = new Map<string, ScoreState & { changedAt: Date }>();
  for (const change of history) {
    if (change.changedAt > at) continue;
    const current = book.get(change.skillId);
    if (!current || current.changedAt <= change.changedAt) book.set(change.skillId, change);
  }
  return book;
}

// Meia-noite de Brasília (UTC-3, sem horário de verão desde 2019) do dia 1 do mês seguinte.
function nextMonthStart(date: Date): Date {
  const local = new Date(date.getTime() - BRASILIA_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1, 3));
}

// Início, o primeiro dia de cada mês seguinte e hoje: dá a curva sem um ponto por nota.
function sampleDates(startedAt: Date, now: Date): Date[] {
  const dates = [startedAt];
  for (let month = nextMonthStart(startedAt); month < now; month = nextMonthStart(month)) dates.push(month);
  if (now > startedAt) dates.push(now);
  return dates.slice(-MAX_POINTS);
}

/**
 * Curva do repassado desde o início, no máximo 12 pontos (os mais recentes).
 * @example evolutionOf(mastered, history, new Date("2026-08-10"), new Date("2026-10-12")) // [{ date: "2026-08-10", percent: 40 }, ...]
 */
export function evolutionOf(mastered: readonly MatrixSkillDto[], history: readonly ScoreChange[], startedAt: Date, now: Date): TransferPointDto[] {
  return sampleDates(startedAt, now).map((date) => ({
    date: dayFormat.format(date),
    percent: progressOf(mastered, scoresAt(history, date)).percent ?? 0,
  }));
}

/**
 * Última nota nova de quem aprende numa habilidade do repasse depois do início; sem nenhuma, o próprio início.
 * @example lastProgressAt(new Set(["s1"]), history, startedAt) // Date da última mudança em s1
 */
export function lastProgressAt(skillIds: ReadonlySet<string>, history: readonly ScoreChange[], startedAt: Date): Date {
  let last = startedAt;
  for (const change of history) {
    if (skillIds.has(change.skillId) && change.changedAt > last) last = change.changedAt;
  }
  return last;
}

/**
 * Repasse em andamento sem nota nova há mais de 60 dias.
 * @example isStale(new Date("2026-07-01"), new Date("2026-10-12"), "active") // true
 */
export function isStale(lastProgress: Date, now: Date, status: string): boolean {
  if (status !== "active") return false;
  return now.getTime() - lastProgress.getTime() > TRANSFER_STALE_DAYS * DAY_MS;
}
