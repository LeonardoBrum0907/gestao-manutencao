import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type McpTokenKind = "access" | "refresh";

export type StoredMcpToken = {
  clientId: string;
  kind: McpTokenKind;
  scopes: string[];
  expiresAt: Date;
};

@Injectable()
export class McpOAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findClient(id: string): Promise<unknown | null> {
    const row = await this.prisma.mcpClient.findUnique({ where: { id }, select: { data: true } });
    return row?.data ?? null;
  }

  async saveClient(id: string, data: unknown): Promise<void> {
    await this.prisma.mcpClient.create({ data: { id, data: data as Prisma.InputJsonValue } });
  }

  async saveToken(tokenHash: string, token: StoredMcpToken): Promise<void> {
    await this.prisma.mcpToken.create({ data: { tokenHash, ...token } });
  }

  async findToken(tokenHash: string): Promise<StoredMcpToken | null> {
    const row = await this.prisma.mcpToken.findUnique({
      where: { tokenHash },
      select: { clientId: true, kind: true, scopes: true, expiresAt: true },
    });
    if (!row || (row.kind !== "access" && row.kind !== "refresh")) return null;
    return { ...row, kind: row.kind };
  }

  // Apaga e diz se apagou: a renovação só vale uma vez, mesmo com dois pedidos ao mesmo tempo.
  async takeToken(tokenHash: string): Promise<boolean> {
    const result = await this.prisma.mcpToken.deleteMany({ where: { tokenHash } });
    return result.count > 0;
  }

  async deleteExpired(now: Date): Promise<void> {
    await this.prisma.mcpToken.deleteMany({ where: { expiresAt: { lt: now } } });
  }
}
