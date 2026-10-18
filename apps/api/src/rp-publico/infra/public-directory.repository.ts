import { Injectable } from "@nestjs/common";
import type { PublicRpDirectoryDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { PublicDirectoryStore } from "../application/ports";

// Liberado na ficha e ainda na casa: férias e afastado continuam aparecendo.
const allowedWhere = { publicRp: true, status: { not: "inactive" } };

@Injectable()
export class PublicDirectoryRepository implements PublicDirectoryStore {
  constructor(private readonly prisma: PrismaService) {}

  async directory(): Promise<PublicRpDirectoryDto> {
    const [factories, lines, machines, members] = await Promise.all([
      this.prisma.factory.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      this.prisma.line.findMany({ select: { id: true, name: true, internalCode: true, factoryId: true }, orderBy: { name: "asc" } }),
      this.prisma.machine.findMany({ select: { id: true, name: true, tag: true, lineId: true }, orderBy: { name: "asc" } }),
      this.prisma.member.findMany({ where: allowedWhere, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);
    return { factories, lines, machines, members };
  }

  async allowedMemberIds(): Promise<string[]> {
    const rows = await this.prisma.member.findMany({ where: allowedWhere, select: { id: true } });
    return rows.map((row) => row.id);
  }

  async memberNames(ids: string[]): Promise<Map<string, string>> {
    if (!ids.length) return new Map();
    const rows = await this.prisma.member.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, name: true } });
    return new Map(rows.map((row) => [row.id, row.name]));
  }

  async setMemberPublicRp(memberId: string, enabled: boolean): Promise<{ id: string; publicRp: boolean } | null> {
    const found = await this.prisma.member.updateMany({ where: { id: memberId }, data: { publicRp: enabled } });
    return found.count ? { id: memberId, publicRp: enabled } : null;
  }
}
