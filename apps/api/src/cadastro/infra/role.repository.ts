import { Injectable } from "@nestjs/common";
import { isMatrixCategory, MEMBER_ROLES, type MatrixCategory, type MemberRoleDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";

function toRole(row: { id: string; name: string; matrixCategory: string | null }): MemberRoleDto {
  return { id: row.id, name: row.name, matrixCategory: isMatrixCategory(row.matrixCategory) ? row.matrixCategory : null };
}

// Num banco novo, Mecânico e Eletricista já nascem na categoria da matriz delas.
const SEED_CATEGORY: Partial<Record<(typeof MEMBER_ROLES)[number], MatrixCategory>> = { mecânico: "mechanical", eletricista: "electrical" };

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSeed(): Promise<void> {
    for (const name of MEMBER_ROLES) {
      await this.prisma.memberRole.upsert({
        where: { name },
        update: {},
        create: { name, matrixCategory: SEED_CATEGORY[name] ?? null },
      });
    }
  }

  async list(): Promise<MemberRoleDto[]> {
    const rows = await this.prisma.memberRole.findMany({ orderBy: { name: "asc" } });
    const order = new Map(MEMBER_ROLES.map((name, index) => [name, index]));
    return rows
      .map(toRole)
      .sort((a, b) => (order.get(a.name as (typeof MEMBER_ROLES)[number]) ?? 99) - (order.get(b.name as (typeof MEMBER_ROLES)[number]) ?? 99));
  }

  find(id: string) {
    return this.prisma.memberRole.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return this.prisma.memberRole.findUnique({ where: { name } });
  }

  async create(name: string): Promise<MemberRoleDto> {
    return toRole(await this.prisma.memberRole.create({ data: { name } }));
  }

  async rename(id: string, name: string): Promise<MemberRoleDto> {
    return toRole(await this.prisma.memberRole.update({ where: { id }, data: { name } }));
  }

  async setMatrixCategory(id: string, matrixCategory: MatrixCategory | null): Promise<MemberRoleDto> {
    return toRole(await this.prisma.memberRole.update({ where: { id }, data: { matrixCategory } }));
  }

  countMembers(id: string) {
    return this.prisma.member.count({ where: { roleId: id } });
  }

  remove(id: string) {
    return this.prisma.memberRole.delete({ where: { id } });
  }
}
