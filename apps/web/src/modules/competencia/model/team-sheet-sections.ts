// Partes da folha A4 da Matriz da equipe que o gestor escolhe antes de gerar o PDF. Legenda e subtotais
// só existem junto com a grade.
export const TEAM_SHEET_SECTIONS = [
  { key: "numeros", label: "Números do topo (cobertura e PDI atrasado)" },
  { key: "grade", label: "Grade de aderência" },
  { key: "subtotais", label: "Subtotais por grupo", disabledWhen: "grade" },
  { key: "legenda", label: "Legenda da grade", disabledWhen: "grade" },
  { key: "treino", label: "Quem treinar primeiro" },
] as const;

export type TeamSheetSection = (typeof TEAM_SHEET_SECTIONS)[number]["key"];

const ALL_SECTIONS: readonly TeamSheetSection[] = TEAM_SHEET_SECTIONS.map((section) => section.key);

/**
 * Partes pedidas no endereço (?secoes=grade,legenda). Sem pedido válido, a folha sai completa.
 * @example parseTeamSheetSections("treino,xyz") // ["treino"]
 */
export function parseTeamSheetSections(param: string | null): TeamSheetSection[] {
  const asked = new Set((param ?? "").split(",").map((item) => item.trim()));
  const picked = ALL_SECTIONS.filter((key) => asked.has(key));
  return picked.length ? picked : [...ALL_SECTIONS];
}

/**
 * Endereço da folha com os filtros da tela e as partes escolhidas; tudo marcado não leva "secoes".
 * @example teamSheetPath(new URLSearchParams("turno=first"), ["grade"]) // "/competencias/folha?turno=first&secoes=grade"
 */
export function teamSheetPath(filters: URLSearchParams, selected: readonly TeamSheetSection[]): string {
  const search = new URLSearchParams(filters);
  search.delete("secoes");
  if (selected.length < ALL_SECTIONS.length) search.set("secoes", selected.join(","));
  return `/competencias/folha?${search.toString()}`;
}
