import { Injectable } from "@nestjs/common";
import type { GradeExpectedDto, MemberGradeDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { gradeExpectedColumns, gradeExpectedOf, type GradeExpectedRow } from "./grade-expected";

function toGradeDto(row: { id: string; name: string } & GradeExpectedRow): MemberGradeDto {
  return { id: row.id, name: row.name, expected: gradeExpectedOf(row) };
}

@Injectable()
export class GradeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<MemberGradeDto[]> {
    const rows = await this.prisma.memberGrade.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] });
    return rows.map(toGradeDto);
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
    return toGradeDto(row);
  }

  async rename(id: string, name: string): Promise<MemberGradeDto> {
    const row = await this.prisma.memberGrade.update({ where: { id }, data: { name } });
    return toGradeDto(row);
  }

  async setExpected(id: string, expected: GradeExpectedDto): Promise<MemberGradeDto> {
    const row = await this.prisma.memberGrade.update({ where: { id }, data: gradeExpectedColumns(expected) });
    return toGradeDto(row);
  }

  countMembers(id: string) {
    return this.prisma.member.count({ where: { gradeId: id } });
  }

  remove(id: string) {
    return this.prisma.memberGrade.delete({ where: { id } });
  }
}
