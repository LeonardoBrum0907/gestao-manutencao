import { Injectable } from "@nestjs/common";
import type { SubassemblyDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";

function toDto(row: { id: string; equipmentId: string; name: string; archived: boolean }): SubassemblyDto {
  return { id: row.id, equipmentId: row.equipmentId, name: row.name, archived: row.archived };
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

  siblings(equipmentId: string) {
    return this.prisma.subassembly.findMany({ where: { equipmentId }, select: { id: true, name: true } });
  }

  equipmentExists(id: string): Promise<boolean> {
    return this.prisma.matrixEquipment.findUnique({ where: { id }, select: { id: true } }).then(Boolean);
  }

  async create(equipmentId: string, name: string): Promise<SubassemblyDto> {
    const last = await this.prisma.subassembly.aggregate({ where: { equipmentId }, _max: { position: true } });
    return toDto(await this.prisma.subassembly.create({ data: { equipmentId, name, position: (last._max.position ?? 0) + 1 } }));
  }

  async update(id: string, input: { name: string; archived: boolean }): Promise<SubassemblyDto> {
    return toDto(await this.prisma.subassembly.update({ where: { id }, data: input }));
  }

  remove(id: string) {
    return this.prisma.subassembly.delete({ where: { id } });
  }
}
