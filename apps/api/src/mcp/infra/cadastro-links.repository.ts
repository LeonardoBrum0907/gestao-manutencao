import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { CadastroLinks } from "../domain/cadastro-removal";

// Conta os lançamentos que perderiam a ligação se o item saísse do cadastro (ver cadastro-removal.ts).
@Injectable()
export class CadastroLinksRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Registro e RP guardam factoryId sem chave estrangeira: a fábrica sairia e o id ficaria solto.
  async ofFactory(id: string): Promise<CadastroLinks> {
    const [records, rps] = await Promise.all([
      this.prisma.record.count({ where: { factoryId: id } }),
      this.prisma.rp.count({ where: { factoryId: id } }),
    ]);
    return { records, rps, techCards: 0 };
  }

  // Os subconjuntos só desta máquina saem junto com ela, então o que aponta para eles conta também.
  async ofMachine(id: string): Promise<CadastroLinks> {
    const own = { subassembly: { machineId: id } };
    const [records, rps, techCards] = await Promise.all([
      this.prisma.record.count({ where: { OR: [{ machineId: id }, own] } }),
      this.prisma.rp.count({ where: { OR: [{ machineId: id }, own] } }),
      this.prisma.techCard.count({ where: own }),
    ]);
    return { records, rps, techCards };
  }

  async ofSubassembly(id: string): Promise<CadastroLinks> {
    const [records, rps, techCards] = await Promise.all([
      this.prisma.record.count({ where: { subassemblyId: id } }),
      this.prisma.rp.count({ where: { subassemblyId: id } }),
      this.prisma.techCard.count({ where: { subassemblyId: id } }),
    ]);
    return { records, rps, techCards };
  }
}
