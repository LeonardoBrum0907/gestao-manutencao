import { GESTOR_TIME_ZONE, type DashboardEvaluationDto } from "@manutencao/shared";
import { calendarDay } from "../../registro/domain/follow-up";

export type QuarterRef = { year: number; quarter: number };
export type QuarterScore = { memberId: string; score: number };
export type NamedMember = { id: string; name: string };

/**
 * O último trimestre que já terminou: a avaliação é feita depois que o trimestre fecha.
 * @example lastClosedQuarter(new Date("2026-10-12T12:00:00Z")) // { year: 2026, quarter: 3 }
 */
export function lastClosedQuarter(now: Date, timeZone: string = GESTOR_TIME_ZONE): QuarterRef {
  const [year, month] = calendarDay(now, timeZone).split("-").map(Number);
  const current = Math.ceil(month / 3);
  return current === 1 ? { year: year - 1, quarter: 4 } : { year, quarter: current - 1 };
}

/**
 * Técnicos sem nenhuma nota no trimestre e os avaliados com média abaixo da meta.
 * @example evaluationOf({ year: 2026, quarter: 3 }, ["a", "b"], [{ memberId: "a", score: 6 }], 8) // { …, missing: 1, belowTarget: 1 }
 */
export function evaluationOf(ref: QuarterRef, technicianIds: readonly string[], scores: readonly QuarterScore[], target: number): DashboardEvaluationDto {
  const byMember = new Map<string, number[]>();
  for (const row of scores) byMember.set(row.memberId, [...(byMember.get(row.memberId) ?? []), row.score]);
  const averages = technicianIds.flatMap((id) => {
    const values = byMember.get(id);
    return values ? [values.reduce((sum, value) => sum + value, 0) / values.length] : [];
  });
  return {
    ...ref,
    technicians: technicianIds.length,
    missing: technicianIds.length - averages.length,
    belowTarget: averages.filter((average) => average < target).length,
    target,
  };
}

/**
 * Quem está sem feedback há mais de `days` dias (ou nunca recebeu), em ordem alfabética.
 * @example silentMembers([{ id: "a", name: "Ana" }], new Map(), agora, 60) // [{ id: "a", name: "Ana" }]
 */
export function silentMembers(members: readonly NamedMember[], lastFeedback: ReadonlyMap<string, Date>, now: Date, days: number): NamedMember[] {
  const limit = now.getTime() - days * 86_400_000;
  return members
    .filter((member) => (lastFeedback.get(member.id)?.getTime() ?? -Infinity) < limit)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
