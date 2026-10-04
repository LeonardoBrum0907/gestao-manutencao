import { GESTOR_TIME_ZONE, type MemberPerformanceDto } from "@manutencao/shared";

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

// Ranking do gráfico: só competência com média, da maior para a menor (empate pela ordem do cadastro).
export function rankedAverages(performance: MemberPerformanceDto) {
  const names = new Map(performance.competencies.map((competency) => [competency.id, competency.name]));
  return performance.competencyAverages
    .filter((item): item is typeof item & { average: number } => item.average !== null)
    .map((item, index) => ({ ...item, name: names.get(item.competencyId) ?? "", index }))
    .sort((a, b) => b.average - a.average || a.index - b.index);
}
