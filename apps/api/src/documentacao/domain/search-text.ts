import type { TechCardFields } from "@manutencao/shared";

/**
 * Texto como a busca compara: minúsculas, sem acento, sem pontuação solta e com um espaço entre palavras.
 * Guardado assim na coluna searchText, o LIKE do Postgres acha "ciclóide" digitado como "cicloide".
 * @example normalizeSearchText("Ciclóide  (817611)") // "cicloide 817611"
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}.\-_/]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tudo que a busca lê de uma ficha, já normalizado: código, título, resumo, campos do tipo, tag, termo original e etiquetas.
 * @example buildSearchText(fields) // "127 verbund ok ... folgemaschine"
 */
export function buildSearchText(fields: TechCardFields): string {
  const pieces = [
    fields.code,
    fields.title,
    fields.summary,
    ...Object.values(fields.details),
    fields.deviceTag,
    fields.originalTerm,
    fields.sheet,
    ...fields.tags,
  ];
  return normalizeSearchText(pieces.filter((piece): piece is string => Boolean(piece)).join(" "));
}

/**
 * Palavras da busca, normalizadas e sem repetição; a ficha precisa conter todas.
 * @example searchTerms("Verbund  127") // ["verbund", "127"]
 */
export function searchTerms(query: string): string[] {
  return [...new Set(normalizeSearchText(query).split(" ").filter(Boolean))];
}

export type Rankable = {
  code: string | null;
  deviceTag: string | null;
  title: string;
  updatedAt: string;
};

/**
 * Acerto exato: a busca inteira é o código, o nº de peça ou a tag do dispositivo da ficha.
 * @example isExactHit({ code: "938580", ... }, "938580") // true
 */
export function isExactHit(card: Pick<Rankable, "code" | "deviceTag">, query: string): boolean {
  const wanted = normalizeSearchText(query);
  if (!wanted) return false;
  return [card.code, card.deviceTag].some((value) => value && normalizeSearchText(value) === wanted);
}

// Exato primeiro; depois quem tem a busca no começo do código ou no título; por fim a mais recente.
function rankOf(card: Rankable, query: string): number {
  const wanted = normalizeSearchText(query);
  if (isExactHit(card, query)) return 0;
  if (card.code && normalizeSearchText(card.code).startsWith(wanted)) return 1;
  if (normalizeSearchText(card.title).includes(wanted)) return 2;
  return 3;
}

/**
 * Ordena os acertos da busca: exato, código começando pela busca, título contendo a busca, o resto por data.
 * @example rankHits(cards, "938580")[0].code // "938580"
 */
export function rankHits<T extends Rankable>(cards: T[], query: string): T[] {
  return [...cards].sort((a, b) => {
    const byRank = rankOf(a, query) - rankOf(b, query);
    return byRank !== 0 ? byRank : b.updatedAt.localeCompare(a.updatedAt);
  });
}
