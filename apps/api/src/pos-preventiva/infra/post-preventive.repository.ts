import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { PostPreventiveDto, PostPreventiveFields } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";

export type PostPreventiveFilter = {
  lineId: string | null;
  machineId: string | null;
  subassemblyId: string | null;
  memberId: string | null;
  rpId: string | null;
  activeOnly: boolean;
  from: string | null;
  to: string | null;
};

const include = {
  members: { orderBy: { position: "asc" as const }, select: { memberId: true } },
  machine: { select: { lineId: true } },
};

type Row = Prisma.PostPreventiveGetPayload<{ include: typeof include }>;

const day = (date: Date) => date.toISOString().slice(0, 10);
const toDate = (value: string) => new Date(`${value}T00:00:00Z`);

function toDto(row: Row): PostPreventiveDto {
  return {
    id: row.id,
    preventiveDate: day(row.preventiveDate),
    occurrenceDate: row.occurrenceDate ? day(row.occurrenceDate) : null,
    lineId: row.machine.lineId,
    machineId: row.machineId,
    subassemblyId: row.subassemblyId,
    memberIds: row.members.map((link) => link.memberId),
    done: row.done,
    occurrence: row.occurrence,
    preventiveAction: row.preventiveAction,
    attentionPoint: row.attentionPoint,
    attentionActive: row.attentionActive,
    rpId: row.rpId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function data(fields: PostPreventiveFields) {
  return {
    preventiveDate: toDate(fields.preventiveDate),
    occurrenceDate: fields.occurrenceDate ? toDate(fields.occurrenceDate) : null,
    machineId: fields.machineId,
    subassemblyId: fields.subassemblyId,
    done: fields.done,
    occurrence: fields.occurrence,
    preventiveAction: fields.preventiveAction,
    attentionPoint: fields.attentionPoint,
    attentionActive: fields.attentionActive,
    rpId: fields.rpId,
  };
}

const memberRows = (ids: string[]) => ids.map((memberId, position) => ({ memberId, position }));

@Injectable()
export class PostPreventiveRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Mais recentes primeiro. São poucas por semana, então a lista vem inteira, sem paginar.
  async list(filter: PostPreventiveFilter): Promise<PostPreventiveDto[]> {
    const where: Prisma.PostPreventiveWhereInput = {
      ...(filter.lineId ? { machine: { lineId: filter.lineId } } : {}),
      ...(filter.machineId ? { machineId: filter.machineId } : {}),
      ...(filter.subassemblyId ? { subassemblyId: filter.subassemblyId } : {}),
      ...(filter.memberId ? { members: { some: { memberId: filter.memberId } } } : {}),
      ...(filter.rpId ? { rpId: filter.rpId } : {}),
      ...(filter.activeOnly ? { attentionActive: true } : {}),
      ...(filter.from || filter.to
        ? {
            preventiveDate: {
              ...(filter.from ? { gte: toDate(filter.from) } : {}),
              ...(filter.to ? { lte: toDate(filter.to) } : {}),
            },
          }
        : {}),
    };
    const rows = await this.prisma.postPreventive.findMany({
      where,
      include,
      orderBy: [{ preventiveDate: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(toDto);
  }

  async find(id: string): Promise<PostPreventiveDto | null> {
    const row = await this.prisma.postPreventive.findUnique({ where: { id }, include });
    return row ? toDto(row) : null;
  }

  async create(fields: PostPreventiveFields): Promise<PostPreventiveDto> {
    const row = await this.prisma.postPreventive.create({
      data: { ...data(fields), members: { create: memberRows(fields.memberIds) } },
      include,
    });
    return toDto(row);
  }

  async update(id: string, fields: PostPreventiveFields): Promise<PostPreventiveDto> {
    const row = await this.prisma.postPreventive.update({
      where: { id },
      data: { ...data(fields), members: { deleteMany: {}, create: memberRows(fields.memberIds) } },
      include,
    });
    return toDto(row);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.postPreventive.delete({ where: { id } });
  }

  findMachine(id: string) {
    return this.prisma.machine.findUnique({ where: { id }, select: { id: true, equipmentId: true } });
  }

  findSubassembly(id: string) {
    return this.prisma.subassembly.findUnique({ where: { id }, select: { id: true, equipmentId: true, archived: true } });
  }

  rpExists(id: string): Promise<boolean> {
    return this.prisma.rp.findUnique({ where: { id }, select: { id: true } }).then(Boolean);
  }
}
