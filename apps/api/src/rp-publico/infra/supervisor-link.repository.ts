import { Injectable } from "@nestjs/common";
import type { RpSupervisorLinkDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { SupervisorLinkStore } from "../application/ports";

type Row = { id: string; name: string; code: string; createdAt: Date };

function toDto(row: Row): RpSupervisorLinkDto {
  return { id: row.id, name: row.name, code: row.code, createdAt: row.createdAt.toISOString() };
}

@Injectable()
export class SupervisorLinkRepository implements SupervisorLinkStore {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<RpSupervisorLinkDto[]> {
    const rows = await this.prisma.rpSupervisorLink.findMany({ where: { revokedAt: null }, orderBy: { createdAt: "asc" } });
    return rows.map(toDto);
  }

  async create(name: string, code: string, at: Date): Promise<RpSupervisorLinkDto> {
    return toDto(await this.prisma.rpSupervisorLink.create({ data: { name, code, createdAt: at } }));
  }

  async replaceCode(id: string, code: string): Promise<RpSupervisorLinkDto | null> {
    const { count } = await this.prisma.rpSupervisorLink.updateMany({ where: { id, revokedAt: null }, data: { code } });
    if (!count) return null;
    const row = await this.prisma.rpSupervisorLink.findUnique({ where: { id } });
    return row ? toDto(row) : null;
  }

  async revoke(id: string, at: Date): Promise<boolean> {
    const { count } = await this.prisma.rpSupervisorLink.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: at } });
    return count > 0;
  }

  async findActive(code: string): Promise<{ id: string; name: string } | null> {
    return this.prisma.rpSupervisorLink.findFirst({ where: { code, revokedAt: null }, select: { id: true, name: true } });
  }
}
