// Quadrinhos do modelo do WhatsApp: "(X)", "( x )", "(✅)", "(✔️)" marcados; "()" e "( )" vazios.
// O time trocou o X por ✅ em alguns RPs (2026-09-17 e 2026-11-17) e o leitor deixava o status sem marcar.

const MARK = String.raw`(?:X|✅|✔️?|☑️?|✓)`;
const MARKED_BOX = new RegExp(String.raw`\(\s*${MARK}\s*\)`);
const LEADING_BOX = new RegExp(String.raw`^[\s*_\-•]*\(\s*(${MARK})?\s*\)\s*`);

/**
 * Texto depois do primeiro quadrinho marcado, ou null quando não há quadrinho marcado. Recebe o texto já em maiúsculas.
 * @example afterMarkedBox("(✅) CORRIGIDO") // "CORRIGIDO"
 */
export function afterMarkedBox(folded: string): string | null {
  const found = MARKED_BOX.exec(folded);
  return found ? folded.slice(found.index + found[0].length) : null;
}

/** Quadrinho no começo da linha: se está marcado e o que vem depois dele. */
export type LeadingBox = { marked: boolean; rest: string };

/**
 * Quadrinho no começo da linha, como no 4M "(X) *MÁQUINA*" e "() *MATERIAL*". Sem quadrinho, null.
 * @example leadingBox("(X) *MÁQUINA*") // { marked: true, rest: "*MÁQUINA*" }
 */
export function leadingBox(line: string): LeadingBox | null {
  const found = LEADING_BOX.exec(line.toUpperCase());
  if (!found) return null;
  return { marked: found[1] !== undefined, rest: line.slice(found[0].length) };
}
