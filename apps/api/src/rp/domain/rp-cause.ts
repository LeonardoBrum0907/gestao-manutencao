// No 4M do Relatório Padrão o técnico marca a causa com "X" ou "sim" e às vezes escreve o detalhe ao lado,
// como "MÁQUINA: X (FERRAMENTAL)". A marca vira o "marcado" da ficha; o texto da causa fica só com o detalhe.

const MARK = /^(?:\(\s*x\s*\)|\[\s*x\s*\]|x|sim|✓|✔|☑)(?=$|[\s\-–:,.;(])/i;
const SEPARATORS = /^[\s\-–:,.;]+/;
const WRAPPED = /^\(([^()]*)\)$/;

/**
 * Detalhe de uma causa do 4M já marcada, sem a marca do técnico. Sem detalhe, devolve null.
 * @example causeDetail("X (FERRAMENTAL)") // "FERRAMENTAL"
 * @example causeDetail("sim") // null
 */
export function causeDetail(value: string): string | null {
  const rest = value.trim().replace(MARK, "").replace(SEPARATORS, "").trim();
  const detail = WRAPPED.exec(rest)?.[1]?.trim() ?? rest;
  return detail ? detail : null;
}
