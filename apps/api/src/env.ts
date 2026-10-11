export type AppEnv = {
  databaseUrl: string;
  sessionSecret: string;
  cookieSecure: boolean;
  attachmentDir: string;
  port: number;
  // Endereço público por onde o claude.ai chega ao MCP (a Vercel). Sem ele, só vale localhost.
  publicUrl: string;
  // Chave fixa para clientes que mandam cabeçalho (Claude Code). Vazia: só OAuth.
  mcpToken: string | null;
  // Senha do gestor vinda do .env. Vazia: fica a que está no banco.
  gestorPassword: string | null;
};

const MCP_TOKEN_MIN_LENGTH = 32;
const GESTOR_PASSWORD_MIN_LENGTH = 8;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const databaseUrl = source.DATABASE_URL?.trim() ?? "";
  const sessionSecret = source.SESSION_SECRET?.trim() ?? "";
  if (!databaseUrl || !sessionSecret) {
    throw new Error("DATABASE_URL e SESSION_SECRET são obrigatórios.");
  }
  const port = Number(source.PORT ?? "3000");
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT inválida.");
  }
  const publicUrl = (source.PUBLIC_URL?.trim() || `http://localhost:${port}`).replace(/\/+$/, "");
  if (!URL.canParse(publicUrl)) {
    throw new Error("PUBLIC_URL inválida.");
  }
  const mcpToken = source.MCP_TOKEN?.trim() || null;
  if (mcpToken && mcpToken.length < MCP_TOKEN_MIN_LENGTH) {
    throw new Error(`MCP_TOKEN precisa de ao menos ${MCP_TOKEN_MIN_LENGTH} caracteres.`);
  }
  const gestorPassword = source.GESTOR_PASSWORD?.trim() || null;
  if (gestorPassword && gestorPassword.length < GESTOR_PASSWORD_MIN_LENGTH) {
    throw new Error(`GESTOR_PASSWORD precisa de ao menos ${GESTOR_PASSWORD_MIN_LENGTH} caracteres.`);
  }
  return {
    databaseUrl,
    sessionSecret,
    cookieSecure: source.COOKIE_SECURE === "true",
    attachmentDir: source.ATTACHMENT_DIR?.trim() || "/data/attachments",
    port,
    publicUrl,
    mcpToken,
    gestorPassword,
  };
}
