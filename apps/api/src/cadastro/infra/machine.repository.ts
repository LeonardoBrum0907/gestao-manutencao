import { Injectable } from "@nestjs/common";
import { isMachineStatus, type MachineDto, type MachineOperationalStatus } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";

export type MachineWrite = {
  lineId: string;
  equipmentId: string | null;
  name: string;
  tag: string | null;
  manufacturer: string | null;
  status: MachineOperationalStatus;
  notes: string | null;
};

function toDto(row: {
  id: string;
  lineId: string;
  equipmentId: string | null;
  name: string;
  tag: string | null;
  manufacturer: string | null;
  status: string;
  notes: string | null;
}): MachineDto {
  if (!isMachineStatus(row.status)) {
    throw new DomainError("invalid", 500, "Status da máquina gravado é inválido.");
  }
  return {
    id: row.id,
    lineId: row.lineId,
    equipmentId: row.equipmentId,
    name: row.name,
    tag: row.tag,
    manufacturer: row.manufacturer,
    status: row.status,
    notes: row.notes,
  };
}

@Injectable()
export class MachineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<MachineDto[]> {
    const rows = await this.prisma.machine.findMany({ orderBy: [{ lineId: "asc" }, { name: "asc" }] });
    return rows.map(toDto);
  }

  find(id: string) {
    return this.prisma.machine.findUnique({ where: { id } });
  }

  countByLine(lineId: string) {
    return this.prisma.machine.count({ where: { lineId } });
  }

  async create(input: MachineWrite): Promise<MachineDto> {
    return toDto(await this.prisma.machine.create({ data: input }));
  }

  async update(id: string, input: MachineWrite): Promise<MachineDto> {
    return toDto(await this.prisma.machine.update({ where: { id }, data: input }));
  }

  remove(id: string) {
    return this.prisma.machine.delete({ where: { id } });
  }
}
