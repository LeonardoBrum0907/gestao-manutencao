import { GESTOR_TIME_ZONE, PERFORMANCE_COMPETENCIES, type MemberPerformanceDto, type PerformanceCompetency } from "@manutencao/shared";

export function competencyLabel(key: PerformanceCompetency): string {
  return PERFORMANCE_COMPETENCIES.find((item) => item.key === key)?.label ?? key;
}

export function formatScore(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function thisYear(now = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-CA", { timeZone: GESTOR_TIME_ZONE, year: "numeric" }).format(now));
}

// O ano corrente e o anterior sempre aparecem; os demais, só se tiverem nota.
export function yearOptions(performance: MemberPerformanceDto | undefined, current: number): number[] {
  return [...new Set([current, current - 1, ...(performance?.years ?? [])])].sort((a, b) => b - a);
}

// Ranking do gráfico: só competência com média, da maior para a menor (empate pela ordem do catálogo).
export function rankedAverages(performance: MemberPerformanceDto) {
  return performance.competencyAverages
    .filter((item): item is typeof item & { average: number } => item.average !== null)
    .map((item, index) => ({ ...item, index }))
    .sort((a, b) => b.average - a.average || a.index - b.index);
}
