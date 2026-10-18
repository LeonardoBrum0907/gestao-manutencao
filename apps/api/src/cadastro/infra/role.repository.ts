import { Injectable } from "@nestjs/common";
import { isMatrixCategory, type MatrixCategory, type MemberRoleDto } from "@manutencao/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { positionOfRole } from "../domain/member-position";
import type { RoleTeamUse } from "../domain/role-leads-teams";
import { compareRoleNames, rolesToSeed } from "../domain/role-seed";

function toRole(row: { id: string; name: string; matrixCategory: string | null; leadsTeams: boolean }): MemberRoleDto {
  return {
    id: row.id,
    name: row.name,
    matrixCategory: isMatrixCategory(row.matrixCategory) ? row.matrixCategory : null,
    leadsTeams: row.leadsTeams,
  };
}

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSeed(): Promise<void> {
    const seed = rolesToSeed(await this.prisma.memberRole.count());
    if (seed.length) await this.prisma.memberRole.createMany({ data: seed });
  }

  async list(): Promise<MemberRoleDto[]> {
    const rows = await this.prisma.memberRole.findMany();
    return rows.map(toRole).sort((a, b) => compareRoleNames(a.name, b.name));
  }

  find(id: string) {
    return this.prisma.memberRole.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return this.prisma.memberRole.findUnique({ where: { name } });
  }

  async create(name: string): Promise<MemberRoleDto> {
    return toRole(await this.prisma.memberRole.create({ data: { name } }));
  }

  async rename(id: string, name: string): Promise<MemberRoleDto> {
    return toRole(await this.prisma.memberRole.update({ where: { id }, data: { name } }));
  }

  async setMatrixCategory(id: string, matrixCategory: MatrixCategory | null): Promise<MemberRoleDto> {
    return toRole(await this.prisma.memberRole.update({ where: { id }, data: { matrixCategory } }));
  }

  /** Quantas equipes são lideradas por alguém com a função, e quantos com ela estão dentro de uma equipe. */
  async countTeamUse(id: string): Promise<RoleTeamUse> {
    const [leadingTeams, inTeams] = await Promise.all([
      this.prisma.team.count({ where: { supervisor: { roleId: id } } }),
      this.prisma.member.count({ where: { roleId: id, teamId: { not: null } } }),
    ]);
    return { leadingTeams, inTeams };
  }

  // A marca e o cargo de quem tem a função mudam juntos, para o cargo nunca ficar fora da função.
  async setLeadsTeams(id: string, leadsTeams: boolean): Promise<MemberRoleDto> {
    const [role] = await this.prisma.$transaction([
      this.prisma.memberRole.update({ where: { id }, data: { leadsTeams } }),
      this.prisma.member.updateMany({ where: { roleId: id }, data: { position: positionOfRole({ leadsTeams }) } }),
    ]);
    return toRole(role);
  }

  countMembers(id: string) {
    return this.prisma.member.count({ where: { roleId: id } });
  }

  remove(id: string) {
    return this.prisma.memberRole.delete({ where: { id } });
  }
}
