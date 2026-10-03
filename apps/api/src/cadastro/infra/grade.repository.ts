import { Injectable } from "@nestjs/common";
import type { TechnicianGradeDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GradeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<TechnicianGradeDto[]> {
    const rows = await this.prisma.technicianGrade.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] });
    return rows.map((row) => ({ id: row.id, name: row.name }));
  }

  find(id: string) {
    return this.prisma.technicianGrade.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return this.prisma.technicianGrade.findUnique({ where: { name } });
  }

  async create(name: string): Promise<TechnicianGradeDto> {
    const last = await this.prisma.technicianGrade.aggregate({ _max: { position: true } });
    const row = await this.prisma.technicianGrade.create({
      data: { name, position: (last._max.position ?? 0) + 1 },
    });
    return { id: row.id, name: row.name };
  }

  async rename(id: string, name: string): Promise<TechnicianGradeDto> {
    const row = await this.prisma.technicianGrade.update({ where: { id }, data: { name } });
    return { id: row.id, name: row.name };
  }

  countTechnicians(id: string) {
    return this.prisma.technician.count({ where: { gradeId: id } });
  }

  remove(id: string) {
    return this.prisma.technicianGrade.delete({ where: { id } });
  }
}
