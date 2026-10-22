// Filtros do cartão da lista pública: os mesmos da lista do coordenador, menos Fábrica e Linha do texto
// (pedido do Léo, 2026-10-22). Técnico é o "Quem sou", que fica fora daqui porque o aparelho lembra dele.
export const PUBLIC_RP_FILTER_KEYS = ["q", "status", "decision", "lineId", "tag", "repeated", "from", "to"] as const;

export type PublicRpFilterKey = (typeof PUBLIC_RP_FILTER_KEYS)[number];

// Na exportação a avaliação fica presa em Aprovado: não conta como filtro e Limpar não tira.
function clearableKeys(exporting: boolean): readonly PublicRpFilterKey[] {
  return exporting ? PUBLIC_RP_FILTER_KEYS.filter((key) => key !== "decision") : PUBLIC_RP_FILTER_KEYS;
}

/**
 * Se algum filtro do cartão está em uso (para mostrar "Limpar filtros").
 * @example hasPublicRpFilters(new URLSearchParams("tag=EBS"), false) // true
 */
export function hasPublicRpFilters(params: URLSearchParams, exporting: boolean): boolean {
  return clearableKeys(exporting).some((key) => params.get(key));
}

/**
 * Quantos filtros escondidos no celular estão em uso: todos menos Buscar, que fica sempre à vista.
 * @example hiddenPublicRpFiltersInUse(new URLSearchParams("q=motor&tag=EBS&from=2026-10-01"), false) // 2
 */
export function hiddenPublicRpFiltersInUse(params: URLSearchParams, exporting: boolean): number {
  return clearableKeys(exporting).filter((key) => key !== "q" && params.get(key)).length;
}

/**
 * Parâmetros sem os filtros do cartão. "Quem sou", o pedido de revisão e a exportação ficam como estavam.
 * @example withoutPublicRpFilters(new URLSearchParams("memberId=m1&tag=EBS"), false).toString() // "memberId=m1"
 */
export function withoutPublicRpFilters(params: URLSearchParams, exporting: boolean): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of clearableKeys(exporting)) next.delete(key);
  return next;
}
