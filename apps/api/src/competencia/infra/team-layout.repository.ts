import { Injectable } from "@nestjs/common";
import { DEFAULT_TEAM_MATRIX_LAYOUT, type TeamMatrixLayoutDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { parseTeamLayout } from "../domain/team-layout";

const ROW = "default";

@Injectable()
export class TeamLayoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Sem nada salvo ainda, vale a disposição padrão. O que está gravado passa pela mesma validação do PUT.
  async load(): Promise<TeamMatrixLayoutDto> {
    const row = await this.prisma.teamMatrixLayout.findUnique({ where: { id: ROW } });
    if (!row) return DEFAULT_TEAM_MATRIX_LAYOUT;
    return parseTeamLayout(row);
  }

  async save(layout: TeamMatrixLayoutDto): Promise<TeamMatrixLayoutDto> {
    await this.prisma.teamMatrixLayout.upsert({ where: { id: ROW }, create: { id: ROW, ...layout }, update: layout });
    return layout;
  }
}
