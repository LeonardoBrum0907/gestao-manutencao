/** Para onde a API manda os erros no Sentry e com qual nome de ambiente eles chegam. */
export type SentryConfig = { dsn: string; environment: string };

// O ambiente de teste da VPS usa SENTRY_ENVIRONMENT=teste para não misturar com a produção.
const DEFAULT_ENVIRONMENT = "producao";

function describeDsn(dsn: string): string {
  return URL.canParse(dsn) ? `endereço em ${new URL(dsn).host}` : `${dsn.length} caracteres que não formam um endereço`;
}

/**
 * Lê SENTRY_DSN e SENTRY_ENVIRONMENT. Sem DSN, o Sentry fica desligado e os erros vão só para o log.
 * O DSN é o endereço https que o Sentry mostra em Settings › Projects › Client Keys (DSN).
 * @example readSentryConfig({ SENTRY_DSN: "https://abc@o1.ingest.us.sentry.io/2" }) // { dsn: "https://abc@…/2", environment: "producao" }
 */
export function readSentryConfig(source: NodeJS.ProcessEnv): SentryConfig | null {
  const dsn = source.SENTRY_DSN?.trim() ?? "";
  if (!dsn) return null;
  const url = URL.canParse(dsn) ? new URL(dsn) : null;
  if (!url || url.protocol !== "https:" || !url.username || !/^\/\d+$/.test(url.pathname)) {
    // Não repete o DSN inteiro: ele vai parar no log do deploy.
    throw new Error(`SENTRY_DSN precisa ser https://<chave>@<host>/<número do projeto> (recebido: ${describeDsn(dsn)}).`);
  }
  return { dsn, environment: source.SENTRY_ENVIRONMENT?.trim() || DEFAULT_ENVIRONMENT };
}
