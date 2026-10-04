import { Injectable } from "@nestjs/common";
import { MEMBER_ROLES, type MemberRoleDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSeed(): Promise<void> {
    for (const name of MEMBER_ROLES) {
      await this.prisma.memberRole.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
  }

  async list(): Promise<MemberRoleDto[]> {
    const rows = await this.prisma.memberRole.findMany({ orderBy: { name: "asc" } });
    const order = new Map(MEMBER_ROLES.map((name, index) => [name, index]));
    return rows
      .map((row) => ({ id: row.id, name: row.name }))
      .sort((a, b) => (order.get(a.name as (typeof MEMBER_ROLES)[number]) ?? 99) - (order.get(b.name as (typeof MEMBER_ROLES)[number]) ?? 99));
  }

  find(id: string) {
    return this.prisma.memberRole.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return this.prisma.memberRole.findUnique({ where: { name } });
  }

  async create(name: string): Promise<MemberRoleDto> {
    const row = await this.prisma.memberRole.create({ data: { name } });
    return { id: row.id, name: row.name };
  }

  async rename(id: string, name: string): Promise<MemberRoleDto> {
    const row = await this.prisma.memberRole.update({ where: { id }, data: { name } });
    return { id: row.id, name: row.name };
  }
}
