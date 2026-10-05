import { Injectable } from "@nestjs/common";
import { GESTOR_TIME_ZONE } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";
import { isCompetencyScore, type MatrixEntry } from "../domain/matrix";
import type { TeamMemberInput } from "../domain/team";

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: GESTOR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

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
      this.prisma.memberMatrixEquipment.findMany({ where: { memberId }, select: { equipmentId: true } }),
      this.prisma.memberSkill.findMany({ where: { memberId } }),
    ]);
    return {
      equipments: equipments.map((row) => row.equipmentId),
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
        data: equipments.map((equipmentId) => ({ memberId, equipmentId })),
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

  // Técnicos ativos com a matriz e os itens de PDI vencidos, em poucas consultas para a equipe toda.
  async loadTeam(now = new Date()): Promise<TeamMemberInput[]> {
    const members = await this.prisma.member.findMany({
      where: { position: "technician", status: "active" },
      select: { id: true, name: true, shift: true, teamId: true },
      orderBy: { name: "asc" },
    });
    const ids = members.map((member) => member.id);
    const today = new Date(`${dayFormat.format(now)}T00:00:00Z`);
    const [equipments, skills, overdue] = await Promise.all([
      this.prisma.memberMatrixEquipment.findMany({ where: { memberId: { in: ids } }, select: { memberId: true, equipmentId: true } }),
      this.prisma.memberSkill.findMany({ where: { memberId: { in: ids } } }),
      this.prisma.memberPdiItem.groupBy({
        by: ["memberId"],
        where: { memberId: { in: ids }, status: { in: ["planned", "in_progress"] }, dueDate: { lt: today } },
        _count: { _all: true },
      }),
    ]);
    const overdueBy = new Map(overdue.map((row) => [row.memberId, row._count._all]));
    return members.map((member) => ({
      ...member,
      equipments: equipments.filter((row) => row.memberId === member.id).map((row) => row.equipmentId),
      entries: skills
        .filter((row) => row.memberId === member.id)
        .map((row) => ({ skillId: row.skillId, score: score(row.score), notApplicable: row.notApplicable, expected: score(row.expected) })),
      pdiOverdue: overdueBy.get(member.id) ?? 0,
    }));
  }
}
