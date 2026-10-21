import { publicRpPath } from "./public-rp";

const CODE_KEY = "rp-publico-link";
// Código gerado pela API: 24 letras em base64url (apps/api/src/rp-publico/domain/link-code.ts).
const CODE_PATTERN = /^[A-Za-z0-9_-]{24}$/;

/**
 * Código do último link da página pública aberto no aparelho, ou "" quando não há (ou o armazenamento falha).
 * @example rememberedPublicCode(window.localStorage) // "k8F3qP0zLm2xV7sR9tW1yB4n"
 */
export function rememberedPublicCode(storage: Pick<Storage, "getItem"> | null): string {
  try {
    const code = storage?.getItem(CODE_KEY) ?? "";
    return CODE_PATTERN.test(code) ? code : "";
  } catch {
    return "";
  }
}

/**
 * Guarda o código do link aberto, para o login oferecer a volta aos RPs a quem tem o app instalado antigo.
 * Falha calada: sem armazenamento a pessoa só precisa abrir o link de novo.
 * @example rememberPublicCode(window.localStorage, "k8F3qP0zLm2xV7sR9tW1yB4n")
 */
export function rememberPublicCode(storage: Pick<Storage, "setItem"> | null, code: string): void {
  if (!CODE_PATTERN.test(code)) return;
  try {
    storage?.setItem(CODE_KEY, code);
  } catch {
    // Sem armazenamento o login só não mostra o atalho.
  }
}

/**
 * Tela da página pública do último link aberto no aparelho, ou null sem link guardado.
 * @example publicStartTarget(window.localStorage) // "/rp/abrir/k8F3qP0zLm2xV7sR9tW1yB4n"
 */
export function publicStartTarget(storage: Pick<Storage, "getItem"> | null): string | null {
  const code = rememberedPublicCode(storage);
  return code ? publicRpPath(code) : null;
}
