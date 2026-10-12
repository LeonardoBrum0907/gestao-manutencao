import { Injectable } from "@nestjs/common";
import type { EquipmentVersionDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";

function toDto(row: { id: string; equipmentId: string; name: string; archived: boolean }): EquipmentVersionDto {
  return { id: row.id, equipmentId: row.equipmentId, name: row.name, archived: row.archived };
}

@Injectable()
export class EquipmentVersionRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Na ordem do cadastro dentro de cada modelo; quem lê agrupa pelo equipmentId.
  async list(): Promise<EquipmentVersionDto[]> {
    const rows = await this.prisma.equipmentVersion.findMany({ orderBy: [{ equipmentId: "asc" }, { position: "asc" }, { name: "asc" }] });
    return rows.map(toDto);
  }

  find(id: string) {
    return this.prisma.equipmentVersion.findUnique({ where: { id } });
  }

  siblings(equipmentId: string) {
    return this.prisma.equipmentVersion.findMany({ where: { equipmentId }, select: { id: true, name: true } });
  }

  equipmentExists(id: string): Promise<boolean> {
    return this.prisma.matrixEquipment.findUnique({ where: { id }, select: { id: true } }).then(Boolean);
  }

  async create(equipmentId: string, name: string): Promise<EquipmentVersionDto> {
    const last = await this.prisma.equipmentVersion.aggregate({ where: { equipmentId }, _max: { position: true } });
    return toDto(await this.prisma.equipmentVersion.create({ data: { equipmentId, name, position: (last._max.position ?? 0) + 1 } }));
  }

  async update(id: string, input: { name: string; archived: boolean }): Promise<EquipmentVersionDto> {
    return toDto(await this.prisma.equipmentVersion.update({ where: { id }, data: input }));
  }

  async usage(id: string) {
    const [machines, subassemblies] = await Promise.all([
      this.prisma.machine.count({ where: { versionId: id } }),
      this.prisma.subassembly.count({ where: { versionId: id } }),
    ]);
    return { machines, subassemblies };
  }

  remove(id: string) {
    return this.prisma.equipmentVersion.delete({ where: { id } });
  }
}
