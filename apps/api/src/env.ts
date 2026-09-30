export type AppEnv = {
  databaseUrl: string;
  sessionSecret: string;
  cookieSecure: boolean;
  attachmentDir: string;
  port: number;
};

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
  return {
    databaseUrl,
    sessionSecret,
    cookieSecure: source.COOKIE_SECURE === "true",
    attachmentDir: source.ATTACHMENT_DIR?.trim() || "/data/attachments",
    port,
  };
}
