// Valor de DEMO_SEED que libera a carga. Só o docker-compose.demo.yml define: a API da produção nunca tem.
export const DEMO_SEED_ALLOWED = "permitido";

/** O que já existe no banco antes da carga. */
export type DemoDatabaseCounts = { factories: number; members: number; records: number; rps: number };

/**
 * A carga de demonstração apaga o catálogo de partida e grava dados genéricos: só roda com a marca do
 * compose da demonstração e num banco sem cadastro, para nunca encostar num banco de verdade.
 * @example assertDemoSeedAllowed("permitido", { factories: 0, members: 0, records: 0, rps: 0 }) // passa
 * @example assertDemoSeedAllowed(undefined, counts) // lança: falta DEMO_SEED=permitido
 */
export function assertDemoSeedAllowed(flag: string | undefined, counts: DemoDatabaseCounts): void {
  if (flag !== DEMO_SEED_ALLOWED) {
    throw new Error(`A carga de demonstração só roda com DEMO_SEED=${DEMO_SEED_ALLOWED} (recebido: ${flag ?? "vazio"}); esse valor só existe no docker-compose.demo.yml.`);
  }
  const filled = Object.entries(counts).filter(([, count]) => count > 0);
  if (filled.length > 0) {
    const found = filled.map(([table, count]) => `${table}=${count}`).join(", ");
    throw new Error(`A carga de demonstração só roda num banco sem cadastro; este já tem ${found}. Use "caderno-admin demo dados", que recria o banco.`);
  }
}
