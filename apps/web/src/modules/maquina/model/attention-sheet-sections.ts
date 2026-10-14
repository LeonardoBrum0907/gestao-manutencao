// Partes da folha A4 de pós-preventiva que o gestor escolhe antes de gerar o PDF. As cinco primeiras são as
// linhas de cada ponto; a conferência é o quadro de assinatura no fim da folha.
export const ATTENTION_SHEET_SECTIONS = [
  { key: "ponto", label: "Ponto de atenção" },
  { key: "ocorrencia", label: "Ocorrência (com as datas)" },
  { key: "acao", label: "Ação preventiva" },
  { key: "feito", label: "O que foi feito na preventiva" },
  { key: "tecnicos", label: "Técnicos" },
  { key: "conferencia", label: "Conferência do técnico (assinatura e observações)" },
] as const;

export type AttentionSheetSection = (typeof ATTENTION_SHEET_SECTIONS)[number]["key"];

const ALL_SECTIONS: readonly AttentionSheetSection[] = ATTENTION_SHEET_SECTIONS.map((section) => section.key);

// A folha da máquina inteira saía sem "o que foi feito" e "técnicos" (só a de uma ficha trazia); esse continua
// sendo o padrão dela para não alongar a folha que o técnico leva.
const MACHINE_DEFAULT: readonly AttentionSheetSection[] = ["ponto", "ocorrencia", "acao", "conferencia"];

/**
 * Partes que a folha mostra quando o endereço não pede nenhuma: tudo na ficha única, o resumo na folha da máquina.
 * @example defaultAttentionSections(false) // ["ponto", "ocorrencia", "acao", "conferencia"]
 */
export function defaultAttentionSections(singleRecord: boolean): AttentionSheetSection[] {
  return [...(singleRecord ? ALL_SECTIONS : MACHINE_DEFAULT)];
}

/**
 * Partes pedidas no endereço (?secoes=ponto,acao), na ordem da folha. Sem pedido válido, vale o padrão.
 * @example parseAttentionSections("acao,xyz,ponto", true) // ["ponto", "acao"]
 */
export function parseAttentionSections(param: string | null, singleRecord: boolean): AttentionSheetSection[] {
  const asked = new Set((param ?? "").split(",").map((item) => item.trim()));
  const picked = ALL_SECTIONS.filter((key) => asked.has(key));
  return picked.length ? picked : defaultAttentionSections(singleRecord);
}

/**
 * Endereço da folha com as partes escolhidas; quando a escolha é o padrão, não leva "secoes".
 * @example attentionSheetPath("m1", "f1", ["ponto"]) // "/maquinas/m1/folha?ficha=f1&secoes=ponto"
 */
export function attentionSheetPath(machineId: string, recordId: string | null, selected: readonly AttentionSheetSection[]): string {
  const search = new URLSearchParams();
  if (recordId) search.set("ficha", recordId);
  const ordered = ALL_SECTIONS.filter((key) => selected.includes(key));
  if (ordered.join(",") !== defaultAttentionSections(Boolean(recordId)).join(",")) search.set("secoes", ordered.join(","));
  const query = search.toString();
  return `/maquinas/${machineId}/folha${query ? `?${query}` : ""}`;
}
