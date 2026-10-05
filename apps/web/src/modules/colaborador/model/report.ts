import type { MemberPerformanceDto } from "@manutencao/shared";

// Faixas do selo da nota geral (0 a 10), como no relatório do SIGEM.
export function performanceBand(average: number | null): string {
  if (average === null) return "";
  if (average >= 9.5) return "Excelente";
  if (average >= 7) return "Muito bom";
  if (average >= 5) return "Bom";
  if (average >= 3) return "Regular";
  return "Ruim";
}

export function quartersEvaluated(performance: MemberPerformanceDto): number {
  return performance.quarterAverages.filter((value) => value !== null).length;
}
