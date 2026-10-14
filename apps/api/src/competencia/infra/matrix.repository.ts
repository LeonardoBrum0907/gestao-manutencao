import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { expectedByLevel, GESTOR_TIME_ZONE } from "@manutencao/shared";
import { gradeExpectedOf, GRADE_EXPECTED_SELECT } from "../../cadastro/infra/grade-expected";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";
import { isCompetencyScore, type ExpectedByLevel, type MatrixEntry } from "../domain/matrix";
import { changedSkills, nextStates } from "../domain/skill-history";
import type { TeamMemberInput } from "../domain/team";

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: GESTOR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

function score(value: number | null): MatrixEntry["score"] {
  if (value === null) return null;
  if (!isCompetencyScore(value)) throw new DomainError("invalid", 500, "Nota gravada está inválida.");
  return value;
}

async function upsertSkills(tx: Prisma.TransactionClient, memberId: string, entries: MatrixEntry[]): Promise<void> {
  for (const entry of entries) {
    const data = { score: entry.score, notApplicable: entry.notApplicable, expected: entry.expected };
    await tx.memberSkill.upsert({
      where: { memberId_skillId: { memberId, skillId: entry.skillId } },
      create: { memberId, skillId: entry.skillId, ...data },
      update: data,
    });
  }
}

@Injectable()
export class MatrixRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(memberId: string): Promise<{
    equipments: string[];
    entries: MatrixEntry[];
    gradeName: string | null;
    expectedByLevel: ExpectedByLevel;
  }> {
    const [equipments, skills, member] = await Promise.all([
      this.prisma.memberMatrixEquipment.findMany({ where: { memberId }, select: { equipmentId: true } }),
      this.prisma.memberSkill.findMany({ where: { memberId } }),
      this.prisma.member.findUnique({ where: { id: memberId }, select: { grade: { select: { name: true, ...GRADE_EXPECTED_SELECT } } } }),
    ]);
    const grade = member?.grade ?? null;
    return {
      gradeName: grade?.name ?? null,
      expectedByLevel: expectedByLevel(grade ? gradeExpectedOf(grade) : null),
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
    await this.saveSkills(memberId, [entry], []);
  }

  // Tudo ou nada: ou entram todas as notas, ou nenhuma. O que mudou de verdade vai também para o histórico.
  async saveSkills(memberId: string, entries: MatrixEntry[], clear: string[]): Promise<void> {
    const skillIds = [...entries.map((entry) => entry.skillId), ...clear];
    await this.prisma.$transaction(async (tx) => {
      const previous = await tx.memberSkill.findMany({
        where: { memberId, skillId: { in: skillIds } },
        select: { skillId: true, score: true, notApplicable: true },
      });
      await upsertSkills(tx, memberId, entries);
      await tx.memberSkill.deleteMany({ where: { memberId, skillId: { in: clear } } });
      const changed = changedSkills(previous, nextStates(entries, clear));
      await tx.memberSkillHistory.createMany({ data: changed.map((state) => ({ memberId, ...state })) });
    });
  }

  async clearSkill(memberId: string, skillId: string): Promise<void> {
    await this.saveSkills(memberId, [], [skillId]);
  }

  // Técnicos ativos com a matriz e os itens de PDI vencidos, em poucas consultas para a equipe toda.
  async loadTeam(now = new Date()): Promise<TeamMemberInput[]> {
    const members = await this.prisma.member.findMany({
      where: { position: "technician", status: "active" },
      select: {
        id: true,
        name: true,
        shift: true,
        teamId: true,
        team: { select: { name: true } },
        grade: { select: { name: true, ...GRADE_EXPECTED_SELECT } },
      },
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
    return members.map(({ grade, team, ...member }) => ({
      ...member,
      gradeName: grade?.name ?? null,
      teamName: team?.name ?? null,
      expectedByLevel: expectedByLevel(grade ? gradeExpectedOf(grade) : null),
      equipments: equipments.filter((row) => row.memberId === member.id).map((row) => row.equipmentId),
      entries: skills
        .filter((row) => row.memberId === member.id)
        .map((row) => ({ skillId: row.skillId, score: score(row.score), notApplicable: row.notApplicable, expected: score(row.expected) })),
      pdiOverdue: overdueBy.get(member.id) ?? 0,
    }));
  }
}
