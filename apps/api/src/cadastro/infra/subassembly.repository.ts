import { Injectable } from "@nestjs/common";
import type { SubassemblyDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { SubassemblyPlace, SubassemblySibling } from "../domain/hierarchy";

function toDto(row: { id: string; equipmentId: string; machineId: string | null; name: string; archived: boolean }): SubassemblyDto {
  return { id: row.id, equipmentId: row.equipmentId, machineId: row.machineId, name: row.name, archived: row.archived };
}

@Injectable()
export class SubassemblyRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Na ordem do cadastro dentro de cada modelo; quem lê agrupa pelo equipmentId.
  async list(): Promise<SubassemblyDto[]> {
    const rows = await this.prisma.subassembly.findMany({ orderBy: [{ equipmentId: "asc" }, { position: "asc" }, { name: "asc" }] });
    return rows.map(toDto);
  }

  find(id: string) {
    return this.prisma.subassembly.findUnique({ where: { id } });
  }

  siblings(equipmentId: string): Promise<SubassemblySibling[]> {
    return this.prisma.subassembly.findMany({ where: { equipmentId }, select: { id: true, name: true, machineId: true } });
  }

  equipmentExists(id: string): Promise<boolean> {
    return this.prisma.matrixEquipment.findUnique({ where: { id }, select: { id: true } }).then(Boolean);
  }

  findMachine(id: string) {
    return this.prisma.machine.findUnique({ where: { id }, select: { id: true, equipmentId: true } });
  }

  async create(equipmentId: string, place: SubassemblyPlace, name: string): Promise<SubassemblyDto> {
    const last = await this.prisma.subassembly.aggregate({ where: { equipmentId }, _max: { position: true } });
    const data = { equipmentId, machineId: place.machineId, name, position: (last._max.position ?? 0) + 1 };
    return toDto(await this.prisma.subassembly.create({ data }));
  }

  async update(id: string, input: { name: string; archived: boolean }): Promise<SubassemblyDto> {
    return toDto(await this.prisma.subassembly.update({ where: { id }, data: input }));
  }

  countPostPreventives(id: string) {
    return this.prisma.postPreventive.count({ where: { subassemblyId: id } });
  }

  remove(id: string) {
    return this.prisma.subassembly.delete({ where: { id } });
  }
}
