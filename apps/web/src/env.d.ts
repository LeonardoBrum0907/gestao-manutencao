// Variáveis de ambiente que o Vite embute no bundle (definidas na Vercel). Só as com prefixo VITE_.
interface ImportMetaEnv {
  // DSN do projeto React no Sentry. Vazio: a tela não manda erros.
  readonly VITE_SENTRY_DSN?: string;
  // Nome do ambiente no Sentry. Vazio: producao. Nos previews da Vercel, use preview.
  readonly VITE_SENTRY_ENVIRONMENT?: string;
}
