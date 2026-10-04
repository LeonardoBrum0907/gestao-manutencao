import { Injectable } from "@nestjs/common";
import type { MemberGradeDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GradeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<MemberGradeDto[]> {
    const rows = await this.prisma.memberGrade.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] });
    return rows.map((row) => ({ id: row.id, name: row.name }));
  }

  find(id: string) {
    return this.prisma.memberGrade.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return this.prisma.memberGrade.findUnique({ where: { name } });
  }

  async create(name: string): Promise<MemberGradeDto> {
    const last = await this.prisma.memberGrade.aggregate({ _max: { position: true } });
    const row = await this.prisma.memberGrade.create({
      data: { name, position: (last._max.position ?? 0) + 1 },
    });
    return { id: row.id, name: row.name };
  }

  async rename(id: string, name: string): Promise<MemberGradeDto> {
    const row = await this.prisma.memberGrade.update({ where: { id }, data: { name } });
    return { id: row.id, name: row.name };
  }

  countMembers(id: string) {
    return this.prisma.member.count({ where: { gradeId: id } });
  }

  remove(id: string) {
    return this.prisma.memberGrade.delete({ where: { id } });
  }
}
