import { GESTOR_TIME_ZONE, QUARTERS, type MemberPerformanceDto } from "@manutencao/shared";

export function formatScore(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

const yearFormat = new Intl.DateTimeFormat("en-CA", { timeZone: GESTOR_TIME_ZONE, year: "numeric" });

export function thisYear(now = new Date()): number {
  return Number(yearFormat.format(now));
}

// O ano corrente e o anterior sempre aparecem; os demais, só se tiverem nota.
export function yearOptions(performance: MemberPerformanceDto | undefined, current: number): number[] {
  return [...new Set([current, current - 1, ...(performance?.years ?? [])])].sort((a, b) => b - a);
}

// Faixa de cor do ponto: 9 a 10, 7 a 8, 5 a 6 e até 4.
export function scoreBand(score: number): "high" | "good" | "mid" | "low" {
  return score >= 9 ? "high" : score >= 7 ? "good" : score >= 5 ? "mid" : "low";
}

// Variação entre os dois últimos trimestres que têm nota; null se houver menos de dois.
export function lastDelta(scores: (number | null)[]): number | null {
  const filled = scores.filter((value): value is number => value !== null);
  return filled.length < 2 ? null : filled[filled.length - 1]! - filled[filled.length - 2]!;
}

// Ranking do gráfico: só competência com média, da maior para a menor (empate pela ordem do cadastro).
// Cada linha traz a nota de cada trimestre (null sem nota) e a variação do último trimestre.
export function rankedAverages(performance: MemberPerformanceDto) {
  const names = new Map(performance.competencies.map((competency) => [competency.id, competency.name]));
  return performance.competencyAverages
    .filter((item): item is typeof item & { average: number } => item.average !== null)
    .map((item, index) => {
      const scores = QUARTERS.map(
        (quarter) =>
          performance.entries.find((entry) => entry.competencyId === item.competencyId && entry.quarter === quarter)?.score ?? null,
      );
      return { ...item, name: names.get(item.competencyId) ?? "", index, scores, delta: lastDelta(scores) };
    })
    .sort((a, b) => b.average - a.average || a.index - b.index);
}
