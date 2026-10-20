import { readSentryConfig, type SentryConfig } from "./observabilidade/sentry-config";

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
  // Chaves do envio de avisos ao celular (Web Push). Nulas: Configurações › Avisos diz que faltam.
  vapid: VapidKeys | null;
  // Destino dos erros no Sentry. Nulo: os erros vão só para o log.
  sentry: SentryConfig | null;
};

/** Par de chaves VAPID do servidor e o contato que os serviços de push recebem junto (https: ou mailto:). */
export type VapidKeys = { publicKey: string; privateKey: string; subject: string };

// Tamanho em base64url das chaves que `web-push generate-vapid-keys` gera (P-256: 65 e 32 bytes).
const VAPID_PUBLIC_KEY_LENGTH = 87;
const VAPID_PRIVATE_KEY_LENGTH = 43;
const BASE64URL = /^[A-Za-z0-9_-]+$/;

function assertVapidKey(name: string, value: string, length: number): void {
  if (value.length === length && BASE64URL.test(value)) return;
  throw new Error(`${name} precisa ter ${length} caracteres base64url (recebido: ${value.length} caracteres). Gere com: pnpm --filter @manutencao/api exec web-push generate-vapid-keys`);
}

/**
 * Lê as chaves VAPID do ambiente. As duas vêm juntas ou nenhuma; o contato padrão é o endereço público
 * quando ele é https (os serviços de push recusam http).
 * @example readVapidKeys({ VAPID_PUBLIC_KEY: "B…", VAPID_PRIVATE_KEY: "x…" }, "https://app.exemplo") // { …, subject: "https://app.exemplo" }
 */
export function readVapidKeys(source: NodeJS.ProcessEnv, publicUrl: string): VapidKeys | null {
  const publicKey = source.VAPID_PUBLIC_KEY?.trim() ?? "";
  const privateKey = source.VAPID_PRIVATE_KEY?.trim() ?? "";
  if (!publicKey && !privateKey) return null;
  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY vêm juntas: defina as duas ou nenhuma.");
  }
  assertVapidKey("VAPID_PUBLIC_KEY", publicKey, VAPID_PUBLIC_KEY_LENGTH);
  assertVapidKey("VAPID_PRIVATE_KEY", privateKey, VAPID_PRIVATE_KEY_LENGTH);
  const fallback = publicUrl.startsWith("https:") ? publicUrl : "mailto:gestor@localhost";
  const subject = source.VAPID_SUBJECT?.trim() || fallback;
  if (!subject.startsWith("https:") && !subject.startsWith("mailto:")) {
    throw new Error(`VAPID_SUBJECT precisa começar com https: ou mailto: (recebido: ${subject}).`);
  }
  return { publicKey, privateKey, subject };
}

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
    vapid: readVapidKeys(source, publicUrl),
    sentry: readSentryConfig(source),
  };
}
