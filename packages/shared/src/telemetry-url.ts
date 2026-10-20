// O código do link público de RP é a senha da página (sem login): não pode sair em log nem no Sentry.
const PUBLIC_RP_CODE = /(\/(?:api\/public\/rp|rp\/abrir)\/)[^/?#\s]+/g;
// Consulta e âncora podem levar códigos do OAuth do MCP ou filtros com nomes: ficam de fora.
const QUERY_OR_HASH = /[?#][^\s]*/g;

/**
 * Limpa um endereço ou caminho antes de ir para log ou para o Sentry: troca o código do link público
 * de RP por `:code` e tira a consulta e a âncora. Funciona também num texto com vários endereços.
 * @example telemetrySafeUrl("https://app/rp/abrir/k8F3x/novo?de=zap") // "https://app/rp/abrir/:code/novo"
 */
export function telemetrySafeUrl(text: string): string {
  return text.replace(PUBLIC_RP_CODE, "$1:code").replace(QUERY_OR_HASH, "");
}
