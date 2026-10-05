import { Injectable } from "@nestjs/common";
import { isMemberPosition, type MemberPosition } from "@manutencao/shared";
import type { CadastroRefs } from "../../ports/cadastro-refs";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PrismaCadastroRefs implements CadastroRefs {
  constructor(private readonly prisma: PrismaService) {}

  async factoryExists(id: string): Promise<boolean> {
    const row = await this.prisma.factory.findUnique({ where: { id }, select: { id: true } });
    return Boolean(row);
  }

  async machineExists(id: string): Promise<boolean> {
    const row = await this.prisma.machine.findUnique({ where: { id }, select: { id: true } });
    return Boolean(row);
  }

  async memberExists(id: string): Promise<boolean> {
    const row = await this.prisma.member.findUnique({ where: { id }, select: { id: true } });
    return Boolean(row);
  }

  async machinesExist(ids: string[]): Promise<boolean> {
    const unique = [...new Set(ids)];
    if (!unique.length) return true;
    return (await this.prisma.machine.count({ where: { id: { in: unique } } })) === unique.length;
  }

  async membersExist(ids: string[]): Promise<boolean> {
    const unique = [...new Set(ids)];
    if (!unique.length) return true;
    return (await this.prisma.member.count({ where: { id: { in: unique } } })) === unique.length;
  }

  async memberPosition(id: string): Promise<MemberPosition | null> {
    const row = await this.prisma.member.findUnique({ where: { id }, select: { position: true } });
    return row && isMemberPosition(row.position) ? row.position : null;
  }

  async memberDirectory() {
    const rows = await this.prisma.member.findMany({ select: { id: true, name: true, status: true } });
    return rows.map((row) => ({ id: row.id, name: row.name, active: row.status === "active" }));
  }

  async machineDirectory() {
    return this.prisma.machine.findMany({ select: { id: true, name: true, internalCode: true, factoryId: true } });
  }
}
