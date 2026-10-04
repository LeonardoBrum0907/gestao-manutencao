import { Injectable } from "@nestjs/common";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";
import { isCompetencyScore, type MatrixEntry } from "../domain/matrix";

function score(value: number | null): MatrixEntry["score"] {
  if (value === null) return null;
  if (!isCompetencyScore(value)) throw new DomainError("invalid", 500, "Nota gravada está inválida.");
  return value;
}

@Injectable()
export class MatrixRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(memberId: string): Promise<{ equipments: string[]; entries: MatrixEntry[] }> {
    const [equipments, skills] = await Promise.all([
      this.prisma.memberMatrixEquipment.findMany({ where: { memberId }, select: { equipment: true } }),
      this.prisma.memberSkill.findMany({ where: { memberId } }),
    ]);
    return {
      equipments: equipments.map((row) => row.equipment),
      entries: skills.map((row) => ({
        skillId: row.skillId,
        score: score(row.score),
        notApplicable: row.notApplicable,
        expected: score(row.expected),
      })),
    };
  }

  async replaceEquipments(memberId: string, equipments: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.memberMatrixEquipment.deleteMany({ where: { memberId } }),
      this.prisma.memberMatrixEquipment.createMany({
        data: equipments.map((equipment) => ({ memberId, equipment })),
      }),
    ]);
  }

  async saveSkill(memberId: string, entry: MatrixEntry): Promise<void> {
    const data = { score: entry.score, notApplicable: entry.notApplicable, expected: entry.expected };
    await this.prisma.memberSkill.upsert({
      where: { memberId_skillId: { memberId, skillId: entry.skillId } },
      create: { memberId, skillId: entry.skillId, ...data },
      update: data,
    });
  }

  async clearSkill(memberId: string, skillId: string): Promise<void> {
    await this.prisma.memberSkill.deleteMany({ where: { memberId, skillId } });
  }
}
