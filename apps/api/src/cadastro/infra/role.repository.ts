import { Injectable } from "@nestjs/common";
import { TECHNICIAN_ROLES, type TechnicianRoleDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSeed(): Promise<void> {
    for (const name of TECHNICIAN_ROLES) {
      await this.prisma.technicianRole.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
  }

  async list(): Promise<TechnicianRoleDto[]> {
    const rows = await this.prisma.technicianRole.findMany({ orderBy: { name: "asc" } });
    const order = new Map(TECHNICIAN_ROLES.map((name, index) => [name, index]));
    return rows
      .map((row) => ({ id: row.id, name: row.name }))
      .sort((a, b) => (order.get(a.name as (typeof TECHNICIAN_ROLES)[number]) ?? 99) - (order.get(b.name as (typeof TECHNICIAN_ROLES)[number]) ?? 99));
  }

  find(id: string) {
    return this.prisma.technicianRole.findUnique({ where: { id } });
  }
}
