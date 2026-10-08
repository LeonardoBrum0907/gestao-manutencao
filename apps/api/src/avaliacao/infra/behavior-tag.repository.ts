import { Injectable } from "@nestjs/common";
import { isBehaviorTagGroup, type BehaviorTagDto, type BehaviorTagGroup } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { sortBehaviorTags } from "../domain/behavior-tag-catalog";

type Row = { id: string; group: string; name: string; archived: boolean };

function toDto(row: Row): BehaviorTagDto {
  // O banco só recebe categorias validadas; a checagem é para o tipo.
  const group: BehaviorTagGroup = isBehaviorTagGroup(row.group) ? row.group : "situation";
  return { id: row.id, group, name: row.name, archived: row.archived };
}

@Injectable()
export class BehaviorTagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<BehaviorTagDto[]> {
    return sortBehaviorTags(await this.prisma.behaviorTag.findMany()).map(toDto);
  }

  find(id: string) {
    return this.prisma.behaviorTag.findUnique({ where: { id } });
  }

  findByName(group: BehaviorTagGroup, name: string) {
    return this.prisma.behaviorTag.findUnique({ where: { group_name: { group, name } } });
  }

  async create(group: BehaviorTagGroup, name: string): Promise<BehaviorTagDto> {
    const last = await this.prisma.behaviorTag.aggregate({ where: { group }, _max: { position: true } });
    return toDto(await this.prisma.behaviorTag.create({ data: { group, name, position: (last._max.position ?? 0) + 1 } }));
  }

  async update(id: string, input: { name: string; archived: boolean }): Promise<BehaviorTagDto> {
    return toDto(await this.prisma.behaviorTag.update({ where: { id }, data: input }));
  }

  async reorder(ids: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "BehaviorTag" AS t SET "position" = o.pos::int
      FROM unnest(${ids}::text[]) WITH ORDINALITY AS o(id, pos)
      WHERE t."id" = o.id`;
  }

  countMembers(id: string) {
    return this.prisma.memberBehavior.count({ where: { tags: { has: id } } });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.behaviorTag.delete({ where: { id } });
  }
}
