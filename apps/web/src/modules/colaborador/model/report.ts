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

export const REPORT_SECTIONS = [
  { key: "perfil", label: "Perfil", technicianOnly: false },
  { key: "comportamento", label: "Comportamento", technicianOnly: false },
  { key: "desempenho", label: "Avaliação de desempenho", technicianOnly: true },
  { key: "matriz", label: "Matriz de competências", technicianOnly: true },
  { key: "pdi", label: "PDI e feedback", technicianOnly: false },
] as const;

export type ReportSectionKey = (typeof REPORT_SECTIONS)[number]["key"];

export function reportSectionsFor(isTechnician: boolean) {
  return REPORT_SECTIONS.filter((section) => isTechnician || !section.technicianOnly);
}

// Seções pedidas na URL (?secoes=matriz,pdi). Sem pedido válido, o relatório é o geral (todas as seções do cargo).
export function parseReportSections(param: string | null, isTechnician: boolean): ReportSectionKey[] {
  const available = reportSectionsFor(isTechnician).map((section) => section.key);
  const asked = new Set((param ?? "").split(",").map((item) => item.trim()));
  const picked = available.filter((key) => asked.has(key));
  return picked.length ? picked : available;
}

// Todas marcadas vira o relatório geral, sem parâmetro na URL.
export function reportPath(memberId: string, selected: ReportSectionKey[], isTechnician: boolean): string {
  const base = `/cadastro/colaboradores/${memberId}/relatorio`;
  const available = reportSectionsFor(isTechnician);
  return selected.length === available.length ? base : `${base}?secoes=${selected.join(",")}`;
}
