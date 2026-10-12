import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import * as z from "zod";
import { DomainError } from "../../kernel/domain-error";

// Peças comuns às ferramentas do MCP (consulta e lançamento), usadas por mcp-tools.ts e mcp-doc-tools.ts.

export type ToolLog = (tool: string, clientId: string | undefined) => void;

export const READ = { readOnlyHint: true, openWorldHint: false } as const;
export const CREATE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } as const;
export const CHANGE = { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false } as const;

export const id = (what: string) => z.string().min(1).describe(`id ${what} (de buscar_cadastro ou de uma listagem)`);
export const optionalText = (what: string) => z.string().nullable().optional().describe(what);

/**
 * Roda o caso de uso e devolve o resultado como texto JSON; DomainError vira erro legível para a IA corrigir.
 * @example () => answer(() => uc.machines.list())
 */
export async function answer(work: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    const result = await work();
    return { content: [{ type: "text", text: JSON.stringify(result ?? { ok: true }) }] };
  } catch (error) {
    if (error instanceof DomainError) {
      return { isError: true, content: [{ type: "text", text: error.message }] };
    }
    console.error("[mcp] erro inesperado", error);
    return { isError: true, content: [{ type: "text", text: "Erro inesperado no servidor." }] };
  }
}

type ToolExtra = { authInfo?: { clientId: string } };

/**
 * Handler de ferramenta que grava: registra quem chamou no log e responde como `answer`.
 * @example server.registerTool("criar_x", {...}, write("criar_x", (fields) => uc.xs.create(fields)))
 */
export function toolWriter(log: ToolLog) {
  return <A>(name: string, run: (args: A) => Promise<unknown>) =>
    (args: A, extra: ToolExtra) => {
      log(name, extra.authInfo?.clientId);
      return answer(() => run(args));
    };
}
