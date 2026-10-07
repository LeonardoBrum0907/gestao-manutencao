import { Injectable } from "@nestjs/common";
import {
  isMemberPosition,
  isMemberShift,
  isMemberStatus,
  type MemberDto,
  type MemberPosition,
  type MemberShift,
  type MemberStatus,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";

type MemberWrite = {
  name: string;
  position: MemberPosition;
  teamId: string | null;
  roleId: string | null;
  gradeId: string | null;
  shift: MemberShift;
  area: string | null;
  status: MemberStatus;
  registration: string | null;
  contact: string | null;
  notes: string | null;
};

function toDto(row: {
  id: string;
  name: string;
  position: string;
  teamId: string | null;
  roleId: string | null;
  gradeId: string | null;
  shift: string;
  area: string | null;
  status: string;
  registration: string | null;
  contact: string | null;
  notes: string | null;
  role: { name: string } | null;
  grade: { name: string } | null;
  team: { name: string } | null;
}): MemberDto {
  if (!isMemberPosition(row.position) || !isMemberShift(row.shift) || !isMemberStatus(row.status)) {
    throw new DomainError("invalid", 500, "Colaborador gravado está inválido.");
  }
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    teamId: row.teamId,
    teamName: row.team?.name ?? null,
    roleId: row.roleId,
    roleName: row.role?.name ?? null,
    gradeId: row.gradeId,
    gradeName: row.grade?.name ?? null,
    shift: row.shift,
    area: row.area,
    status: row.status,
    registration: row.registration,
    contact: row.contact,
    notes: row.notes,
  };
}

const include = { role: true, grade: true, team: true } as const;

@Injectable()
export class MemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<MemberDto[]> {
    const rows = await this.prisma.member.findMany({
      include,
      orderBy: { name: "asc" },
    });
    return rows.map(toDto);
  }

  find(id: string) {
    return this.prisma.member.findUnique({ where: { id } });
  }

  async create(input: MemberWrite): Promise<MemberDto> {
    const row = await this.prisma.member.create({ data: input, include });
    return toDto(row);
  }

  async update(id: string, input: MemberWrite): Promise<MemberDto> {
    const row = await this.prisma.member.update({
      where: { id },
      data: input,
      include,
    });
    return toDto(row);
  }

  async countRecords(id: string): Promise<number> {
    const counts = await Promise.all([
      this.prisma.record.count({ where: { memberId: id } }),
      this.prisma.recordMember.count({ where: { memberId: id } }),
      this.prisma.rpMember.count({ where: { memberId: id } }),
      this.prisma.postPreventiveMember.count({ where: { memberId: id } }),
    ]);
    return counts.reduce((sum, count) => sum + count, 0);
  }

  countPdiFiles(id: string) {
    return this.prisma.memberAttachment.count({ where: { memberId: id } });
  }

  async setTeam(id: string, teamId: string | null): Promise<void> {
    await this.prisma.member.update({ where: { id }, data: { teamId } });
  }

  remove(id: string) {
    return this.prisma.member.delete({ where: { id } });
  }
}
