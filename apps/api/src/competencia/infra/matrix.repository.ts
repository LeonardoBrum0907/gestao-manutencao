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

  async load(technicianId: string): Promise<{ equipments: string[]; entries: MatrixEntry[] }> {
    const [equipments, skills] = await Promise.all([
      this.prisma.technicianMatrixEquipment.findMany({ where: { technicianId }, select: { equipment: true } }),
      this.prisma.technicianSkill.findMany({ where: { technicianId } }),
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

  async replaceEquipments(technicianId: string, equipments: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.technicianMatrixEquipment.deleteMany({ where: { technicianId } }),
      this.prisma.technicianMatrixEquipment.createMany({
        data: equipments.map((equipment) => ({ technicianId, equipment })),
      }),
    ]);
  }

  async saveSkill(technicianId: string, entry: MatrixEntry): Promise<void> {
    const data = { score: entry.score, notApplicable: entry.notApplicable, expected: entry.expected };
    await this.prisma.technicianSkill.upsert({
      where: { technicianId_skillId: { technicianId, skillId: entry.skillId } },
      create: { technicianId, skillId: entry.skillId, ...data },
      update: data,
    });
  }

  async clearSkill(technicianId: string, skillId: string): Promise<void> {
    await this.prisma.technicianSkill.deleteMany({ where: { technicianId, skillId } });
  }
}
