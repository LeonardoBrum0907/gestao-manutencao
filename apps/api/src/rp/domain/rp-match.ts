import { rpPlacePrefixMatch, sameRpPlace } from "@manutencao/shared";

// Casa a linha do texto do RP com o cadastro (os técnicos ficam em rp-member-match.ts).
// Só aceita quando há uma resposta única:
// na dúvida o texto original é guardado e o gestor escolhe na revisão.

export type LineRef = { id: string; name: string; internalCode: string | null; factoryId: string };

export function plain(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Linha do cadastro para a linha e a TAG lidas do RP, só quando há uma resposta única. Compara sem caixa, acento,
 * pontuação nem zero à esquerda ("med6" é MED 06) e, por último, aceita nome encurtado com o mesmo número
 * ("Uhl 2" é UHLMANN 02, "Medseal 07" é MED 07).
 * @example matchLine("med6", null, linhas)?.name // "MED 06"
 */
export function matchLine(line: string | null, tag: string | null, lines: LineRef[]): LineRef | null {
  const byCode = (value: string | null) => (value ? lines.filter((line) => line.internalCode && sameRpPlace(value, line.internalCode)) : []);
  const byName = (value: string | null) => (value ? lines.filter((line) => sameRpPlace(value, line.name)) : []);
  const byShortName = (value: string | null) => (value ? lines.filter((line) => rpPlacePrefixMatch(value, line.name)) : []);
  for (const found of [byCode(tag), byName(tag), byName(line), byCode(line), byShortName(line)]) {
    if (found.length === 1) return found[0]!;
  }
  return null;
}
