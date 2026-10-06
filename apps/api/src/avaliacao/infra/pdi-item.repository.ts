import { Injectable } from "@nestjs/common";
import type { PdiItemDto, PdiItemStatus } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { PdiItemFields } from "../domain/pdi-item";

type Row = {
  id: string;
  memberId: string;
  title: string;
  skillId: string | null;
  machineId: string | null;
  responsibleId: string | null;
  dueDate: Date | null;
  status: string;
  notes: string | null;
  completedAt: Date | null;
  createdAt: Date;
};

function toDto(row: Row): PdiItemDto {
  return {
    id: row.id,
    memberId: row.memberId,
    title: row.title,
    skillId: row.skillId,
    machineId: row.machineId,
    responsibleId: row.responsibleId,
    dueDate: row.dueDate ? row.dueDate.toISOString().slice(0, 10) : null,
    status: row.status as PdiItemStatus,
    notes: row.notes,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

function toData(fields: Partial<PdiItemFields>) {
  const { dueDate, ...rest } = fields;
  return dueDate === undefined ? rest : { ...rest, dueDate: dueDate === null ? null : new Date(`${dueDate}T00:00:00Z`) };
}

@Injectable()
export class PdiItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(memberId: string): Promise<PdiItemDto[]> {
    const rows = await this.prisma.memberPdiItem.findMany({ where: { memberId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    return rows.map(toDto);
  }

  find(memberId: string, id: string) {
    return this.prisma.memberPdiItem.findFirst({ where: { id, memberId } });
  }

  async skillExists(id: string): Promise<boolean> {
    return (await this.prisma.matrixSkill.count({ where: { id } })) > 0;
  }

  async create(memberId: string, fields: Partial<PdiItemFields> & { title: string }): Promise<PdiItemDto> {
    return toDto(await this.prisma.memberPdiItem.create({ data: { memberId, ...toData(fields), title: fields.title } }));
  }

  async update(id: string, fields: Partial<PdiItemFields>, completedAt: Date | null | undefined): Promise<PdiItemDto> {
    const data = completedAt === undefined ? toData(fields) : { ...toData(fields), completedAt };
    return toDto(await this.prisma.memberPdiItem.update({ where: { id }, data }));
  }

  async remove(id: string): Promise<void> {
    await this.prisma.memberPdiItem.delete({ where: { id } });
  }
}
