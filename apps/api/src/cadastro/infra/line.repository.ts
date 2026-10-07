import { Injectable } from "@nestjs/common";
import {
  isMachineStatus,
  type LineDto,
  type MachineOperationalStatus,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";

type LineWrite = {
  name: string;
  factoryId: string;
  sector: string | null;
  manufacturer: string | null;
  internalCode: string | null;
  status: MachineOperationalStatus;
  notes: string | null;
  isDailyLine: boolean;
  isCritical: boolean;
};

function toDto(row: {
  id: string;
  name: string;
  factoryId: string;
  sector: string | null;
  manufacturer: string | null;
  internalCode: string | null;
  status: string;
  notes: string | null;
  isDailyLine: boolean;
  isCritical: boolean;
}): LineDto {
  if (!isMachineStatus(row.status)) {
    throw new DomainError("invalid", 500, "Status da linha gravado é inválido.");
  }
  return {
    id: row.id,
    name: row.name,
    factoryId: row.factoryId,
    sector: row.sector,
    manufacturer: row.manufacturer,
    internalCode: row.internalCode,
    status: row.status,
    notes: row.notes,
    isDailyLine: row.isDailyLine,
    isCritical: row.isCritical,
  };
}

@Injectable()
export class LineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<LineDto[]> {
    const rows = await this.prisma.line.findMany({ orderBy: { name: "asc" } });
    return rows.map(toDto);
  }

  find(id: string) {
    return this.prisma.line.findUnique({ where: { id } });
  }

  async create(input: LineWrite): Promise<LineDto> {
    const row = await this.prisma.line.create({ data: input });
    return toDto(row);
  }

  async update(id: string, input: LineWrite): Promise<LineDto> {
    const row = await this.prisma.line.update({ where: { id }, data: input });
    return toDto(row);
  }

  remove(id: string) {
    return this.prisma.line.delete({ where: { id } });
  }
}
