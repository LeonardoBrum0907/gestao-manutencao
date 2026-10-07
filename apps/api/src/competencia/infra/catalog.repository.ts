import { Injectable } from "@nestjs/common";
import { isCompetencyLevel, type MatrixCatalogDto, type MatrixEquipmentDto, type MatrixSkillDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";

type SkillRow = { id: string; equipmentId: string; subgroup: string; text: string; level: string; archived: boolean };

function toSkill(row: SkillRow): MatrixSkillDto {
  if (!isCompetencyLevel(row.level)) throw new DomainError("invalid", 500, "Habilidade gravada está inválida.");
  return { id: row.id, equipmentId: row.equipmentId, subgroup: row.subgroup, text: row.text, level: row.level, archived: row.archived };
}

function toEquipment(row: { id: string; name: string; archived: boolean; minQualified: number }): MatrixEquipmentDto {
  return { id: row.id, name: row.name, archived: row.archived, minQualified: row.minQualified };
}

export type SkillWrite = { equipmentId: string; subgroup: string; text: string; level: string };

const CATALOG_TTL_MS = 60_000;

@Injectable()
export class CatalogRepository {
  // O catálogo (9 equipamentos, 222 habilidades) é lido em toda abertura e toda marcação da matriz e quase
  // não muda. Fica em memória por 1 min e é descartado em qualquer escrita feita por este repositório.
  private cached: { catalog: MatrixCatalogDto; until: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async load(): Promise<MatrixCatalogDto> {
    if (this.cached && this.cached.until > Date.now()) return this.cached.catalog;
    const catalog = await this.loadFresh();
    this.cached = { catalog, until: Date.now() + CATALOG_TTL_MS };
    return catalog;
  }

  private async changing<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } finally {
      this.cached = null;
    }
  }

  private async loadFresh(): Promise<MatrixCatalogDto> {
    const [equipments, skills] = await Promise.all([
      this.prisma.matrixEquipment.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] }),
      this.prisma.matrixSkill.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
    ]);
    const order = new Map(equipments.map((equipment, index) => [equipment.id, index]));
    return {
      equipments: equipments.map(toEquipment),
      skills: skills
        .sort((a, b) => (order.get(a.equipmentId) ?? 0) - (order.get(b.equipmentId) ?? 0))
        .map(toSkill),
    };
  }

  findEquipment(id: string) {
    return this.prisma.matrixEquipment.findUnique({ where: { id } });
  }

  findEquipmentByName(name: string) {
    return this.prisma.matrixEquipment.findUnique({ where: { name } });
  }

  async createEquipment(name: string): Promise<MatrixEquipmentDto> {
    return this.changing(async () => {
      const last = await this.prisma.matrixEquipment.aggregate({ _max: { position: true } });
      return toEquipment(await this.prisma.matrixEquipment.create({ data: { name, position: (last._max.position ?? 0) + 1 } }));
    });
  }

  async updateEquipment(id: string, input: { name: string; archived: boolean; minQualified?: number }): Promise<MatrixEquipmentDto> {
    return this.changing(async () => {
      return toEquipment(await this.prisma.matrixEquipment.update({ where: { id }, data: input }));
    });
  }

  async equipmentUsage(id: string): Promise<{ skills: number; members: number; subassemblies: number; machines: number }> {
    const [skills, members, subassemblies, machines] = await Promise.all([
      this.prisma.matrixSkill.count({ where: { equipmentId: id } }),
      this.prisma.memberMatrixEquipment.count({ where: { equipmentId: id } }),
      this.prisma.subassembly.count({ where: { equipmentId: id } }),
      this.prisma.machine.count({ where: { equipmentId: id } }),
    ]);
    return { skills, members, subassemblies, machines };
  }

  async removeEquipment(id: string): Promise<void> {
    return this.changing(async () => {
      await this.prisma.matrixEquipment.delete({ where: { id } });
    });
  }

  // Uma ida ao banco para a lista toda: um UPDATE por item custava uma viagem de rede cada.
  async reorderEquipments(ids: string[]): Promise<void> {
    return this.changing(async () => {
      await this.prisma.$executeRaw`
        UPDATE "MatrixEquipment" AS t SET "position" = o.pos::int
        FROM unnest(${ids}::text[]) WITH ORDINALITY AS o(id, pos)
        WHERE t."id" = o.id`;
    });
  }

  findSkill(id: string) {
    return this.prisma.matrixSkill.findUnique({ where: { id } });
  }

  skillIdsOf(equipmentId: string): Promise<string[]> {
    return this.prisma.matrixSkill
      .findMany({ where: { equipmentId }, orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true } })
      .then((rows) => rows.map((row) => row.id));
  }

  private async nextSkillPosition(equipmentId: string): Promise<number> {
    const last = await this.prisma.matrixSkill.aggregate({ where: { equipmentId }, _max: { position: true } });
    return (last._max.position ?? 0) + 1;
  }

  async createSkill(input: SkillWrite): Promise<MatrixSkillDto> {
    return this.changing(async () => {
      const position = await this.nextSkillPosition(input.equipmentId);
      return toSkill(await this.prisma.matrixSkill.create({ data: { ...input, position } }));
    });
  }

  // Mudou de equipamento: vai para o fim da lista do novo.
  async updateSkill(id: string, input: SkillWrite & { archived: boolean }, moved: boolean): Promise<MatrixSkillDto> {
    return this.changing(async () => {
      const position = moved ? await this.nextSkillPosition(input.equipmentId) : undefined;
      return toSkill(await this.prisma.matrixSkill.update({ where: { id }, data: { ...input, ...(position ? { position } : {}) } }));
    });
  }

  countSkillScores(id: string) {
    return this.prisma.memberSkill.count({ where: { skillId: id } });
  }

  async removeSkill(id: string): Promise<void> {
    return this.changing(async () => {
      await this.prisma.matrixSkill.delete({ where: { id } });
    });
  }

  async reorderSkills(ids: string[]): Promise<void> {
    return this.changing(async () => {
      await this.prisma.$executeRaw`
        UPDATE "MatrixSkill" AS t SET "position" = o.pos::int
        FROM unnest(${ids}::text[]) WITH ORDINALITY AS o(id, pos)
        WHERE t."id" = o.id`;
    });
  }
}
