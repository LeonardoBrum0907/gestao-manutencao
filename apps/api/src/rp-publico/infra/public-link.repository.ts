import { Injectable } from "@nestjs/common";
import type { RpPublicLinkDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { PublicLinkStore } from "../application/ports";

function toDto(row: { code: string; createdAt: Date }): RpPublicLinkDto {
  return { code: row.code, createdAt: row.createdAt.toISOString() };
}

@Injectable()
export class PublicLinkRepository implements PublicLinkStore {
  constructor(private readonly prisma: PrismaService) {}

  async active(): Promise<RpPublicLinkDto | null> {
    const row = await this.prisma.rpPublicLink.findFirst({ where: { revokedAt: null }, orderBy: { createdAt: "desc" } });
    return row ? toDto(row) : null;
  }

  async isActive(code: string): Promise<boolean> {
    const row = await this.prisma.rpPublicLink.findUnique({ where: { code }, select: { revokedAt: true } });
    return row !== null && row.revokedAt === null;
  }

  async replace(code: string, at: Date): Promise<RpPublicLinkDto> {
    const [, row] = await this.prisma.$transaction([
      this.prisma.rpPublicLink.updateMany({ where: { revokedAt: null }, data: { revokedAt: at } }),
      this.prisma.rpPublicLink.create({ data: { code, createdAt: at } }),
    ]);
    return toDto(row);
  }

  async revokeAll(at: Date): Promise<void> {
    await this.prisma.rpPublicLink.updateMany({ where: { revokedAt: null }, data: { revokedAt: at } });
  }
}
