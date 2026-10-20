import { publicRpPath } from "./public-rp";

// Endereço que o app instalado da página pública abre (start_url de public/rp-publico.webmanifest).
// O manifesto é um arquivo fixo e não sabe o código do link, então esta tela acha o código guardado no aparelho.
export const PUBLIC_RP_START_PATH = "/rp/abrir";

const CODE_KEY = "rp-publico-link";
// Código gerado pela API em base64url (apps/api/src/rp-publico/domain/link-code.ts).
const CODE_PATTERN = /^[A-Za-z0-9_-]{8,}$/;

/**
 * Código do último link da página pública aberto no aparelho, ou "" quando não há (ou o armazenamento falha).
 * @example rememberedPublicCode(window.localStorage) // "k8F3…"
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
 * Guarda o código do link aberto, para o app instalado e o login acharem a página da equipe depois.
 * Falha calada: sem armazenamento a pessoa só precisa abrir o link de novo.
 * @example rememberPublicCode(window.localStorage, "k8F3…")
 */
export function rememberPublicCode(storage: Pick<Storage, "setItem"> | null, code: string): void {
  if (!CODE_PATTERN.test(code)) return;
  try {
    storage?.setItem(CODE_KEY, code);
  } catch {
    // Sem armazenamento o app instalado mostra o campo para colar o link.
  }
}

/**
 * Tira o código de um link colado: o endereço inteiro, só o caminho ou só o código. Devolve "" se não achar.
 * @example publicCodeFromLink("https://gestao-manutencao.vercel.app/rp/abrir/k8F3abcd/novo") // "k8F3abcd"
 */
export function publicCodeFromLink(text: string): string {
  const value = text.trim();
  const fromPath = value.match(/\/rp\/abrir\/([^/?#\s]+)/)?.[1] ?? value;
  return CODE_PATTERN.test(fromPath) ? fromPath : "";
}

/**
 * Tela da página pública para abrir no lugar do início do app instalado, ou null sem link guardado.
 * @example publicStartTarget(window.localStorage) // "/rp/abrir/k8F3…"
 */
export function publicStartTarget(storage: Pick<Storage, "getItem"> | null): string | null {
  const code = rememberedPublicCode(storage);
  return code ? publicRpPath(code) : null;
}
