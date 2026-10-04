import { Injectable } from "@nestjs/common";
import type { TeamDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";

type TeamWrite = {
  name: string;
  description: string | null;
  supervisorId: string | null;
};

const include = {
  supervisor: { select: { name: true } },
  members: { select: { id: true }, orderBy: { name: "asc" as const } },
} as const;

function toDto(row: {
  id: string;
  name: string;
  description: string | null;
  supervisorId: string | null;
  supervisor: { name: string } | null;
  members: { id: string }[];
}): TeamDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    supervisorId: row.supervisorId,
    supervisorName: row.supervisor?.name ?? null,
    memberIds: row.members.map((member) => member.id),
  };
}

@Injectable()
export class TeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<TeamDto[]> {
    const rows = await this.prisma.team.findMany({ include, orderBy: { name: "asc" } });
    return rows.map(toDto);
  }

  find(id: string) {
    return this.prisma.team.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return this.prisma.team.findUnique({ where: { name } });
  }

  async create(input: TeamWrite): Promise<TeamDto> {
    return toDto(await this.prisma.team.create({ data: input, include }));
  }

  async update(id: string, input: TeamWrite): Promise<TeamDto> {
    return toDto(await this.prisma.team.update({ where: { id }, data: input, include }));
  }

  countMembers(id: string) {
    return this.prisma.member.count({ where: { teamId: id } });
  }

  countLedBy(memberId: string) {
    return this.prisma.team.count({ where: { supervisorId: memberId } });
  }

  remove(id: string) {
    return this.prisma.team.delete({ where: { id } });
  }
}
