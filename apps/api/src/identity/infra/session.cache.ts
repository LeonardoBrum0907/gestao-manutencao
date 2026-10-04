import { Injectable } from "@nestjs/common";

const TTL_MS = 30_000;
const MAX_ENTRIES = 500;

// Evita ir ao banco a cada requisição só para reconhecer a mesma sessão. Vale por poucos segundos
// e é limpo no logout, então uma sessão encerrada deixa de valer na hora.
@Injectable()
export class SessionCache {
  private readonly entries = new Map<string, { email: string; sessionExpiresAt: number; cachedUntil: number }>();

  get(tokenHash: string, now: number): string | null {
    const entry = this.entries.get(tokenHash);
    if (!entry) return null;
    if (entry.cachedUntil <= now || entry.sessionExpiresAt <= now) {
      this.entries.delete(tokenHash);
      return null;
    }
    return entry.email;
  }

  set(tokenHash: string, email: string, sessionExpiresAt: Date, now: number): void {
    if (this.entries.size >= MAX_ENTRIES) this.entries.clear();
    this.entries.set(tokenHash, { email, sessionExpiresAt: sessionExpiresAt.getTime(), cachedUntil: now + TTL_MS });
  }

  delete(tokenHash: string): void {
    this.entries.delete(tokenHash);
  }
}
