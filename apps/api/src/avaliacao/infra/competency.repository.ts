import { Injectable } from "@nestjs/common";
import type { PerformanceCompetencyDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";

function toDto(row: { id: string; name: string; archived: boolean }): PerformanceCompetencyDto {
  return { id: row.id, name: row.name, archived: row.archived };
}

@Injectable()
export class CompetencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Com a posição, para montar as linhas do ano na ordem do cadastro.
  listOrdered() {
    return this.prisma.performanceCompetency.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] });
  }

  async list(): Promise<PerformanceCompetencyDto[]> {
    return (await this.listOrdered()).map(toDto);
  }

  find(id: string) {
    return this.prisma.performanceCompetency.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return this.prisma.performanceCompetency.findUnique({ where: { name } });
  }

  async create(name: string): Promise<PerformanceCompetencyDto> {
    const last = await this.prisma.performanceCompetency.aggregate({ _max: { position: true } });
    return toDto(await this.prisma.performanceCompetency.create({ data: { name, position: (last._max.position ?? 0) + 1 } }));
  }

  async update(id: string, input: { name: string; archived: boolean }): Promise<PerformanceCompetencyDto> {
    return toDto(await this.prisma.performanceCompetency.update({ where: { id }, data: input }));
  }

  async reorder(ids: string[]): Promise<void> {
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.performanceCompetency.update({ where: { id }, data: { position: index + 1 } })),
    );
  }

  countScores(id: string) {
    return this.prisma.memberEvaluation.count({ where: { competencyId: id } });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.performanceCompetency.delete({ where: { id } });
  }
}
