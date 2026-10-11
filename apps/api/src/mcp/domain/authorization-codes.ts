import { randomBytes } from "crypto";

export type PendingCode = {
  clientId: string;
  codeChallenge: string;
  redirectUri: string;
  scopes: string[];
  resource: string | null;
  expiresAt: number;
};

const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_PENDING = 200;

// O código da tela de login vive poucos minutos e só na memória: se a API reiniciar no meio, é só entrar de novo.
export class AuthorizationCodes {
  private readonly pending = new Map<string, PendingCode>();

  issue(entry: Omit<PendingCode, "expiresAt">, now: number): string {
    this.prune(now);
    const code = randomBytes(32).toString("hex");
    this.pending.set(code, { ...entry, expiresAt: now + CODE_TTL_MS });
    return code;
  }

  peek(code: string, clientId: string, now: number): PendingCode | null {
    const entry = this.pending.get(code);
    if (!entry || entry.clientId !== clientId) return null;
    if (entry.expiresAt <= now) {
      this.pending.delete(code);
      return null;
    }
    return entry;
  }

  take(code: string, clientId: string, now: number): PendingCode | null {
    const entry = this.peek(code, clientId, now);
    if (entry) this.pending.delete(code);
    return entry;
  }

  private prune(now: number): void {
    for (const [code, entry] of this.pending) {
      if (entry.expiresAt <= now) this.pending.delete(code);
    }
    if (this.pending.size >= MAX_PENDING) this.pending.clear();
  }
}
