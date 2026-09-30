import { Injectable } from "@nestjs/common";
import {
  isMachineStatus,
  type MachineDto,
  type MachineOperationalStatus,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";

type MachineWrite = {
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
}): MachineDto {
  if (!isMachineStatus(row.status)) {
    throw new DomainError("invalid", 500, "Status da máquina gravado é inválido.");
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
export class MachineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<MachineDto[]> {
    const rows = await this.prisma.machine.findMany({ orderBy: { name: "asc" } });
    return rows.map(toDto);
  }

  find(id: string) {
    return this.prisma.machine.findUnique({ where: { id } });
  }

  async create(input: MachineWrite): Promise<MachineDto> {
    const row = await this.prisma.machine.create({ data: input });
    return toDto(row);
  }

  async update(id: string, input: MachineWrite): Promise<MachineDto> {
    const row = await this.prisma.machine.update({ where: { id }, data: input });
    return toDto(row);
  }

  remove(id: string) {
    return this.prisma.machine.delete({ where: { id } });
  }
}
