import { randomBytes } from "node:crypto";

// 18 bytes aleatórios viram 24 letras: ninguém acha o link chutando endereço.
const CODE_BYTES = 18;
const CODE_SHAPE = /^[A-Za-z0-9_-]{24}$/;

/**
 * Código novo do link da página pública de RPs. `random` só muda nos testes.
 * @example newPublicLinkCode() // "k8F3qP0zLm2xV7sR9tW1yB4n"
 */
export function newPublicLinkCode(random: (size: number) => Buffer = randomBytes): string {
  return random(CODE_BYTES).toString("base64url");
}

/**
 * Filtra endereço inventado antes de ir ao banco.
 * @example isPublicLinkCodeShape("abc") // false
 */
export function isPublicLinkCodeShape(code: string): boolean {
  return CODE_SHAPE.test(code);
}
