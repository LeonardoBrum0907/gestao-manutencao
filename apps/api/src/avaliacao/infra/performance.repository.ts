import { Injectable } from "@nestjs/common";
import { isPerformanceScore, type PerformanceEntryDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";
import { requireQuarter } from "../domain/performance";

@Injectable()
export class PerformanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(memberId: string, year: number): Promise<PerformanceEntryDto[]> {
    const rows = await this.prisma.memberEvaluation.findMany({ where: { memberId, year } });
    return rows.map((row) => {
      if (!isPerformanceScore(row.score)) {
        throw new DomainError("invalid", 500, "Avaliação gravada está inválida.");
      }
      return { competencyId: row.competencyId, quarter: requireQuarter(row.quarter), score: row.score };
    });
  }

  async years(memberId: string): Promise<number[]> {
    const rows = await this.prisma.memberEvaluation.findMany({
      where: { memberId },
      distinct: ["year"],
      select: { year: true },
      orderBy: { year: "desc" },
    });
    return rows.map((row) => row.year);
  }

  async save(memberId: string, year: number, entry: PerformanceEntryDto): Promise<void> {
    const key = { memberId, year, quarter: entry.quarter, competencyId: entry.competencyId };
    await this.prisma.memberEvaluation.upsert({
      where: { memberId_year_quarter_competencyId: key },
      create: { ...key, score: entry.score },
      update: { score: entry.score },
    });
  }

  async clear(memberId: string, year: number, quarter: number, competencyId: string): Promise<void> {
    await this.prisma.memberEvaluation.deleteMany({ where: { memberId, year, quarter, competencyId } });
  }
}
