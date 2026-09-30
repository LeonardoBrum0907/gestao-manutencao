import { Injectable } from "@nestjs/common";
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

  async technicianExists(id: string): Promise<boolean> {
    const row = await this.prisma.technician.findUnique({ where: { id }, select: { id: true } });
    return Boolean(row);
  }
}
