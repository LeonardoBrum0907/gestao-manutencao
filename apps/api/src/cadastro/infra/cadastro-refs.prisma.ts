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

  async memberPosition(id: string): Promise<MemberPosition | null> {
    const row = await this.prisma.member.findUnique({ where: { id }, select: { position: true } });
    return row && isMemberPosition(row.position) ? row.position : null;
  }
}
