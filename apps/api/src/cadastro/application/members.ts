import { Injectable } from "@nestjs/common";
import type { MemberDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalString, readObject, requiredString } from "../../kernel/parse";
import { assertMemberShape, assertPositionChange, requirePosition } from "../domain/member-position";
import { assertMemberCanBeRemoved } from "../domain/member-removal";
import { requireName, requireShift, requireMemberStatus } from "../domain/names";
import { GradeRepository } from "../infra/grade.repository";
import { MemberRepository } from "../infra/member.repository";
import { RoleRepository } from "../infra/role.repository";
import { TeamRepository } from "../infra/team.repository";

@Injectable()
export class Members {
  constructor(
    private readonly members: MemberRepository,
    private readonly roles: RoleRepository,
    private readonly grades: GradeRepository,
    private readonly teams: TeamRepository,
  ) {}

  list(): Promise<MemberDto[]> {
    return this.members.list();
  }

  create(body: unknown): Promise<MemberDto> {
    return this.write(body, null);
  }

  update(id: string, body: unknown): Promise<MemberDto> {
    return this.write(body, id);
  }

  async remove(id: string): Promise<void> {
    const current = await this.members.find(id);
    if (!current) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    assertMemberCanBeRemoved(
      await this.members.countRecords(id),
      await this.teams.countLedBy(id),
      await this.members.countPdiFiles(id),
    );
    await this.members.remove(id);
  }

  private async write(body: unknown, id: string | null): Promise<MemberDto> {
    const current = id ? await this.members.find(id) : null;
    if (id && !current) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    const source = readObject(body);
    const position = requirePosition(requiredString(source, "position", "Escolha o cargo."));
    const roleId = optionalString(source, "roleId");
    const teamId = optionalString(source, "teamId");
    assertMemberShape({ position, roleId, teamId });
    if (current) {
      assertPositionChange(requirePosition(current.position), position, await this.teams.countLedBy(current.id));
    }
    if (roleId && !(await this.roles.find(roleId))) {
      throw new DomainError("role", 400, "Função não encontrada.");
    }
    const gradeId = optionalString(source, "gradeId");
    if (gradeId && !(await this.grades.find(gradeId))) {
      throw new DomainError("grade", 400, "Grau não encontrado.");
    }
    if (teamId && !(await this.teams.find(teamId))) {
      throw new DomainError("team", 400, "Equipe não encontrada.");
    }
    const input = {
      name: requireName(requiredString(source, "name", "Informe o nome do colaborador."), "Informe o nome do colaborador."),
      position,
      teamId,
      roleId,
      gradeId,
      shift: requireShift(requiredString(source, "shift", "Escolha o turno.")),
      area: optionalString(source, "area"),
      status: requireMemberStatus(requiredString(source, "status", "Escolha o status.")),
      registration: optionalString(source, "registration"),
      contact: optionalString(source, "contact"),
      notes: optionalString(source, "notes"),
    };
    return id ? this.members.update(id, input) : this.members.create(input);
  }
}
