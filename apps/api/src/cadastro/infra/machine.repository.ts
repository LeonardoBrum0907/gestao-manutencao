import { Injectable } from "@nestjs/common";
import { isMachineStatus, type MachineDto, type MachineOperationalStatus } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";

export type MachineWrite = {
  lineId: string;
  equipmentId: string | null;
  versionId: string | null;
  name: string;
  tag: string | null;
  manufacturer: string | null;
  status: MachineOperationalStatus;
  notes: string | null;
};

const withHidden = { hiddenSubassemblies: { select: { subassemblyId: true } } } as const;

function toDto(row: {
  id: string;
  lineId: string;
  equipmentId: string | null;
  versionId: string | null;
  name: string;
  tag: string | null;
  manufacturer: string | null;
  status: string;
  notes: string | null;
  hiddenSubassemblies: { subassemblyId: string }[];
}): MachineDto {
  if (!isMachineStatus(row.status)) {
    throw new DomainError("invalid", 500, `Status da máquina gravado é inválido (recebido "${row.status}").`);
  }
  return {
    id: row.id,
    lineId: row.lineId,
    equipmentId: row.equipmentId,
    versionId: row.versionId,
    name: row.name,
    tag: row.tag,
    manufacturer: row.manufacturer,
    status: row.status,
    notes: row.notes,
    hiddenSubassemblyIds: row.hiddenSubassemblies.map((item) => item.subassemblyId),
  };
}

@Injectable()
export class MachineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<MachineDto[]> {
    const rows = await this.prisma.machine.findMany({ orderBy: [{ lineId: "asc" }, { name: "asc" }], include: withHidden });
    return rows.map(toDto);
  }

  find(id: string) {
    return this.prisma.machine.findUnique({ where: { id } });
  }

  async findDto(id: string): Promise<MachineDto | null> {
    const row = await this.prisma.machine.findUnique({ where: { id }, include: withHidden });
    return row ? toDto(row) : null;
  }

  findVersion(id: string) {
    return this.prisma.equipmentVersion.findUnique({ where: { id }, select: { id: true, equipmentId: true, archived: true } });
  }

  countPostPreventives(id: string) {
    return this.prisma.postPreventive.count({ where: { machineId: id } });
  }

  countTechCards(id: string) {
    return this.prisma.techCard.count({ where: { machineId: id } });
  }

  countOwnSubassemblies(id: string) {
    return this.prisma.subassembly.count({ where: { machineId: id } });
  }

  countByLine(lineId: string) {
    return this.prisma.machine.count({ where: { lineId } });
  }

  // Escopo dos subconjuntos pedidos, para conferir que chegam à máquina antes de desmarcar.
  async subassemblyScopes(ids: string[]) {
    const rows = await this.prisma.subassembly.findMany({ where: { id: { in: ids } }, select: { id: true, equipmentId: true, versionId: true, machineId: true } });
    return new Map(rows.map((row) => [row.id, row]));
  }

  async create(input: MachineWrite): Promise<MachineDto> {
    return toDto(await this.prisma.machine.create({ data: input, include: withHidden }));
  }

  // Trocar o modelo apaga os desmarcados: eram subconjuntos do modelo antigo.
  async update(id: string, input: MachineWrite, modelChanged: boolean): Promise<MachineDto> {
    const update = this.prisma.machine.update({ where: { id }, data: input, include: withHidden });
    if (!modelChanged) return toDto(await update);
    const [, row] = await this.prisma.$transaction([this.prisma.machineHiddenSubassembly.deleteMany({ where: { machineId: id } }), update]);
    return toDto(row);
  }

  async setHidden(id: string, subassemblyIds: string[]): Promise<MachineDto> {
    const [, , row] = await this.prisma.$transaction([
      this.prisma.machineHiddenSubassembly.deleteMany({ where: { machineId: id } }),
      this.prisma.machineHiddenSubassembly.createMany({ data: subassemblyIds.map((subassemblyId) => ({ machineId: id, subassemblyId })) }),
      this.prisma.machine.findUniqueOrThrow({ where: { id }, include: withHidden }),
    ]);
    return toDto(row);
  }

  remove(id: string) {
    return this.prisma.machine.delete({ where: { id } });
  }
}
