import { Injectable } from "@nestjs/common";
import {
  isTechnicianShift,
  isTechnicianStatus,
  type TechnicianDto,
  type TechnicianShift,
  type TechnicianStatus,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";

type TechnicianWrite = {
  name: string;
  roleId: string;
  shift: TechnicianShift;
  area: string | null;
  status: TechnicianStatus;
  registration: string | null;
  contact: string | null;
  notes: string | null;
};

function toDto(row: {
  id: string;
  name: string;
  roleId: string;
  shift: string;
  area: string | null;
  status: string;
  registration: string | null;
  contact: string | null;
  notes: string | null;
  role: { name: string };
}): TechnicianDto {
  if (!isTechnicianShift(row.shift) || !isTechnicianStatus(row.status)) {
    throw new DomainError("invalid", 500, "Técnico gravado está inválido.");
  }
  return {
    id: row.id,
    name: row.name,
    roleId: row.roleId,
    roleName: row.role.name,
    shift: row.shift,
    area: row.area,
    status: row.status,
    registration: row.registration,
    contact: row.contact,
    notes: row.notes,
  };
}

@Injectable()
export class TechnicianRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<TechnicianDto[]> {
    const rows = await this.prisma.technician.findMany({
      include: { role: true },
      orderBy: { name: "asc" },
    });
    return rows.map(toDto);
  }

  find(id: string) {
    return this.prisma.technician.findUnique({ where: { id } });
  }

  async create(input: TechnicianWrite): Promise<TechnicianDto> {
    const row = await this.prisma.technician.create({ data: input, include: { role: true } });
    return toDto(row);
  }

  async update(id: string, input: TechnicianWrite): Promise<TechnicianDto> {
    const row = await this.prisma.technician.update({
      where: { id },
      data: input,
      include: { role: true },
    });
    return toDto(row);
  }

  remove(id: string) {
    return this.prisma.technician.delete({ where: { id } });
  }
}
