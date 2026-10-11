import type { INestApplication } from "@nestjs/common";
import express, { type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { getOAuthProtectedResourceMetadataUrl, mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { EnvService } from "../../env.module";
import { MCP_INSTRUCTIONS, registerTools, type ToolLog } from "../application/mcp-tools";
import { McpOAuthProvider } from "../application/mcp-oauth.provider";
import { McpUseCases } from "../application/mcp-use-cases";

// Atrás do cloudflared todo pedido vem do mesmo IP; o limite do SDK vira um limite geral, e o
// aviso sobre X-Forwarded-For só polui o log.
const RATE_LIMIT = { validate: { xForwardedForHeader: false } };

// Rotas de fora do Nest: o guard de sessão por cookie não vale aqui. Quem protege /mcp é a chave
// Bearer (OAuth ou MCP_TOKEN); /authorize, /token, /register e /.well-known são do protocolo OAuth.
export function mountMcp(app: INestApplication): void {
  const env = app.get(EnvService);
  const provider = app.get(McpOAuthProvider);
  const useCases = app.get(McpUseCases);
  const issuerUrl = new URL(env.publicUrl);
  const mcpUrl = new URL("/mcp", issuerUrl);

  app.use(
    mcpAuthRouter({
      provider,
      issuerUrl,
      resourceServerUrl: mcpUrl,
      resourceName: "Gestão de Manutenção",
      authorizationOptions: { rateLimit: RATE_LIMIT },
      tokenOptions: { rateLimit: RATE_LIMIT },
      revocationOptions: { rateLimit: RATE_LIMIT },
      // O conector guarda o segredo uma vez só; se vencesse, pararia sem aviso depois de 30 dias.
      clientRegistrationOptions: { rateLimit: RATE_LIMIT, clientSecretExpirySeconds: 0 },
    }),
  );

  const log: ToolLog = (tool, clientId) => console.log(`[mcp] ${tool} (cliente ${clientId ?? "?"})`);
  const router = express.Router();
  router.use(requireBearerAuth({ verifier: provider, resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpUrl) }));
  router.use(express.json({ limit: "1mb" }));
  router.all("/", async (req: Request, res: Response) => {
    // Sem sessão no servidor: cada pedido monta o servidor MCP, responde em JSON e acaba.
    if (req.method !== "POST") {
      res.status(405).set("Allow", "POST").json({ jsonrpc: "2.0", error: { code: -32000, message: "Use POST." }, id: null });
      return;
    }
    const server = new McpServer({ name: "gestao-manutencao", version: "0.1.0" }, { instructions: MCP_INSTRUCTIONS });
    registerTools(server, useCases, log);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("[mcp] falha no pedido", error);
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Erro inesperado." }, id: null });
      }
    }
  });
  app.use("/mcp", router);
}
