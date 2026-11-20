/**
 * O armazenamento do aparelho, ou null quando o navegador bloqueia (aba anônima, dados bloqueados).
 * @example rememberedMember(deviceStorage())
 */
export function deviceStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
