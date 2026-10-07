import { Injectable } from "@nestjs/common";
import type { FactoryDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FactoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<FactoryDto[]> {
    const rows = await this.prisma.factory.findMany({ orderBy: { name: "asc" } });
    return rows.map((row) => ({ id: row.id, name: row.name }));
  }

  find(id: string) {
    return this.prisma.factory.findUnique({ where: { id } });
  }

  async create(name: string): Promise<FactoryDto> {
    const row = await this.prisma.factory.create({ data: { name } });
    return { id: row.id, name: row.name };
  }

  async rename(id: string, name: string): Promise<FactoryDto> {
    const row = await this.prisma.factory.update({ where: { id }, data: { name } });
    return { id: row.id, name: row.name };
  }

  countLines(id: string) {
    return this.prisma.line.count({ where: { factoryId: id } });
  }

  remove(id: string) {
    return this.prisma.factory.delete({ where: { id } });
  }
}
