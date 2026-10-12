const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

// Uma conta só, então a trava é uma só: cinco senhas erradas seguram a tela de login por 15 minutos.
export class LoginAttempts {
  private failures = 0;
  private lockedUntil = 0;

  lockedFor(now: number): number {
    return this.lockedUntil > now ? this.lockedUntil - now : 0;
  }

  fail(now: number): void {
    this.failures += 1;
    if (this.failures >= MAX_FAILURES) {
      this.failures = 0;
      this.lockedUntil = now + LOCK_MS;
    }
  }

  succeed(): void {
    this.failures = 0;
    this.lockedUntil = 0;
  }
}
