import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { TeamLineInput } from "../domain/team-layout";

@Injectable()
export class TeamLinesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Linhas por fábrica e nome, máquinas por nome: a ordem de partida das colunas antes de o gestor arrastar.
  async load(): Promise<TeamLineInput[]> {
    const rows = await this.prisma.line.findMany({
      select: {
        id: true,
        name: true,
        factory: { select: { name: true } },
        machines: { select: { id: true, name: true, equipmentId: true }, orderBy: { name: "asc" } },
      },
      orderBy: [{ factory: { name: "asc" } }, { name: "asc" }],
    });
    return rows.map(({ factory, ...line }) => ({ ...line, factoryName: factory.name }));
  }
}
