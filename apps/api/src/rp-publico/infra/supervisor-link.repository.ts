import { Injectable } from "@nestjs/common";
import type { RpSupervisorLinkDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { SupervisorLinkStore, SupervisorMember } from "../application/ports";
import { holdsSupervisorLink, type SupervisorHolder } from "../domain/supervisor-holder";

type Row = {
  id: string;
  memberId: string | null;
  name: string;
  code: string;
  createdAt: Date;
  member: { name: string; status: string; position: string } | null;
};

// O nome atual do cadastro (o guardado no link só vale se o colaborador foi excluído) e a situação dele hoje.
const withMember = { member: { select: { name: true, status: true, position: true } } } as const;

function holderOf(row: Row): SupervisorHolder {
  return row.member ? { status: row.member.status, position: row.member.position } : null;
}

function toDto(row: Row): RpSupervisorLinkDto {
  return {
    id: row.id,
    memberId: row.memberId,
    name: row.member?.name ?? row.name,
    code: row.code,
    createdAt: row.createdAt.toISOString(),
    stillSupervisor: holdsSupervisorLink(holderOf(row)),
  };
}

@Injectable()
export class SupervisorLinkRepository implements SupervisorLinkStore {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<RpSupervisorLinkDto[]> {
    const rows = await this.prisma.rpSupervisorLink.findMany({ where: { revokedAt: null }, orderBy: { createdAt: "asc" }, include: withMember });
    return rows.map(toDto);
  }

  async create(supervisor: SupervisorMember, code: string, at: Date): Promise<RpSupervisorLinkDto> {
    const data = { memberId: supervisor.id, name: supervisor.name, code, createdAt: at };
    return toDto(await this.prisma.rpSupervisorLink.create({ data, include: withMember }));
  }

  async replaceCode(id: string, code: string): Promise<RpSupervisorLinkDto | null> {
    const { count } = await this.prisma.rpSupervisorLink.updateMany({ where: { id, revokedAt: null }, data: { code } });
    if (!count) return null;
    const row = await this.prisma.rpSupervisorLink.findUnique({ where: { id }, include: withMember });
    return row ? toDto(row) : null;
  }

  async revoke(id: string, at: Date): Promise<boolean> {
    const { count } = await this.prisma.rpSupervisorLink.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: at } });
    return count > 0;
  }

  async findActive(code: string): Promise<{ id: string; name: string; holder: SupervisorHolder } | null> {
    const row = await this.prisma.rpSupervisorLink.findFirst({ where: { code, revokedAt: null }, include: withMember });
    return row ? { id: row.id, name: row.member?.name ?? row.name, holder: holderOf(row) } : null;
  }

  // O cargo segue a função: "supervisor" quando a função lidera equipe (role.repository mantém isso).
  async findSupervisor(memberId: string): Promise<SupervisorMember | null> {
    return this.prisma.member.findFirst({ where: { id: memberId, position: "supervisor" }, select: { id: true, name: true } });
  }
}
