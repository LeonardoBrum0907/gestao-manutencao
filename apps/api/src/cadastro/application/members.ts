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

  // As regras da exclusão, sem excluir: a tela pergunta antes de oferecer o botão.
  async checkRemoval(id: string): Promise<void> {
    const current = await this.members.find(id);
    if (!current) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    const [records, ledTeams, pdiFiles] = await Promise.all([
      this.members.countRecords(id),
      this.teams.countLedBy(id),
      this.members.countPdiFiles(id),
    ]);
    assertMemberCanBeRemoved(records, ledTeams, pdiFiles);
  }

  async remove(id: string): Promise<void> {
    await this.checkRemoval(id);
    await this.members.remove(id);
  }

  private async write(body: unknown, id: string | null): Promise<MemberDto> {
    const source = readObject(body);
    const roleId = optionalString(source, "roleId");
    const gradeId = optionalString(source, "gradeId");
    const teamId = optionalString(source, "teamId");
    // As buscas não dependem umas das outras: uma viagem ao banco em vez de cinco.
    const [current, role, grade, team] = await Promise.all([
      id ? this.members.find(id) : null,
      roleId ? this.roles.find(roleId) : null,
      gradeId ? this.grades.find(gradeId) : null,
      teamId ? this.teams.find(teamId) : null,
    ]);
    if (id && !current) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    const position = requirePosition(requiredString(source, "position", "Escolha o cargo."));
    assertMemberShape({ position, roleId, teamId });
    if (current) {
      assertPositionChange(requirePosition(current.position), position, await this.teams.countLedBy(current.id));
    }
    if (roleId && !role) throw new DomainError("role", 400, "Função não encontrada.");
    if (gradeId && !grade) throw new DomainError("grade", 400, "Grau não encontrado.");
    if (teamId && !team) throw new DomainError("team", 400, "Equipe não encontrada.");
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
