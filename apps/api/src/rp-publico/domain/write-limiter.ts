import { DomainError } from "../../kernel/domain-error";

export type WriteKind = "create" | "write";
export type WriteRule = { limit: number; windowMs: number };

// Sem login não dá para limitar por pessoa, e atrás da Vercel e do Caddy o IP é sempre o do proxy:
// o limite vale para a página toda. É folgado para o time e segura um robô ou um envio em laço.
export const PUBLIC_WRITE_RULES: Record<WriteKind, WriteRule> = {
  create: { limit: 30, windowMs: 60 * 60 * 1000 },
  write: { limit: 120, windowMs: 60 * 60 * 1000 },
};

/**
 * Janela deslizante de envios da página pública, na memória da API (reinício zera).
 * @example new PublicWriteLimiter(PUBLIC_WRITE_RULES).take("create")
 */
export class PublicWriteLimiter {
  private readonly hits: Record<WriteKind, number[]> = { create: [], write: [] };

  constructor(
    private readonly rules: Record<WriteKind, WriteRule>,
    private readonly now: () => number = Date.now,
  ) {}

  take(kind: WriteKind): void {
    const rule = this.rules[kind];
    const at = this.now();
    const recent = this.hits[kind].filter((hit) => at - hit < rule.windowMs);
    if (recent.length >= rule.limit) {
      this.hits[kind] = recent;
      throw new DomainError("rate_limit", 429, limitMessage(kind, rule));
    }
    this.hits[kind] = [...recent, at];
  }
}

function limitMessage(kind: WriteKind, rule: WriteRule): string {
  const minutes = Math.round(rule.windowMs / 60_000);
  const what = kind === "create" ? "relatórios novos" : "alterações";
  return `Muitos ${what} pela página pública em pouco tempo (limite: ${rule.limit} a cada ${minutes} min). Tente de novo mais tarde.`;
}
