/**
 * Pergunta se o banco responde. O /health usa para não dizer "ok" com o Postgres fora do ar.
 * @example if (!(await probe.isReachable())) throw new ServiceUnavailableException("…")
 */
export interface DatabaseProbe {
  isReachable(): Promise<boolean>;
}

export const DATABASE_PROBE = Symbol("DatabaseProbe");
