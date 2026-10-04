import { Injectable } from "@nestjs/common";
import {
  isMemberShift,
  isMemberStatus,
  type MemberDto,
  type MemberShift,
  type MemberStatus,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PrismaService } from "../../prisma/prisma.service";

type MemberWrite = {
  name: string;
  roleId: string;
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
  roleId: string;
  gradeId: string | null;
  shift: string;
  area: string | null;
  status: string;
  registration: string | null;
  contact: string | null;
  notes: string | null;
  role: { name: string };
  grade: { name: string } | null;
}): MemberDto {
  if (!isMemberShift(row.shift) || !isMemberStatus(row.status)) {
    throw new DomainError("invalid", 500, "Colaborador gravado está inválido.");
  }
  return {
    id: row.id,
    name: row.name,
    roleId: row.roleId,
    roleName: row.role.name,
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

@Injectable()
export class MemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<MemberDto[]> {
    const rows = await this.prisma.member.findMany({
      include: { role: true, grade: true },
      orderBy: { name: "asc" },
    });
    return rows.map(toDto);
  }

  find(id: string) {
    return this.prisma.member.findUnique({ where: { id } });
  }

  async create(input: MemberWrite): Promise<MemberDto> {
    const row = await this.prisma.member.create({ data: input, include: { role: true, grade: true } });
    return toDto(row);
  }

  async update(id: string, input: MemberWrite): Promise<MemberDto> {
    const row = await this.prisma.member.update({
      where: { id },
      data: input,
      include: { role: true, grade: true },
    });
    return toDto(row);
  }

  async countRecords(id: string): Promise<number> {
    const [owned, linked] = await Promise.all([
      this.prisma.record.count({ where: { memberId: id } }),
      this.prisma.recordMember.count({ where: { memberId: id } }),
    ]);
    return owned + linked;
  }

  remove(id: string) {
    return this.prisma.member.delete({ where: { id } });
  }
}
