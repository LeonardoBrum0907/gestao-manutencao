import { Injectable } from "@nestjs/common";
import type { TeamDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalString, readObject, requiredString } from "../../kernel/parse";
import { assertCanJoinTeam, requirePosition } from "../domain/member-position";
import { requireName } from "../domain/names";
import { assertCanLead, assertTeamCanBeRemoved, assertTeamNameAvailable } from "../domain/team";
import { MemberRepository } from "../infra/member.repository";
import { TeamRepository } from "../infra/team.repository";

@Injectable()
export class Teams {
  constructor(
    private readonly teams: TeamRepository,
    private readonly members: MemberRepository,
  ) {}

  list(): Promise<TeamDto[]> {
    return this.teams.list();
  }

  create(body: unknown): Promise<TeamDto> {
    return this.write(body, null);
  }

  async update(id: string, body: unknown): Promise<TeamDto> {
    await this.requireTeam(id);
    return this.write(body, id);
  }

  async remove(id: string): Promise<void> {
    await this.requireTeam(id);
    assertTeamCanBeRemoved(await this.teams.countMembers(id));
    await this.teams.remove(id);
  }

  async addMember(teamId: string, memberId: string): Promise<void> {
    await this.requireTeam(teamId);
    const member = await this.requireMember(memberId);
    assertCanJoinTeam(requirePosition(member.position));
    await this.members.setTeam(memberId, teamId);
  }

  async removeMember(teamId: string, memberId: string): Promise<void> {
    await this.requireTeam(teamId);
    const member = await this.requireMember(memberId);
    if (member.teamId !== teamId) {
      throw new DomainError("not_found", 404, "Esse colaborador não está nesta equipe.");
    }
    await this.members.setTeam(memberId, null);
  }

  private async write(body: unknown, id: string | null): Promise<TeamDto> {
    const source = readObject(body);
    const name = requireName(requiredString(source, "name", "Informe o nome da equipe."), "Informe o nome da equipe.");
    const owner = await this.teams.findByName(name);
    assertTeamNameAvailable(owner?.id ?? null, id);
    const supervisorId = optionalString(source, "supervisorId");
    if (supervisorId) {
      const supervisor = await this.members.find(supervisorId);
      if (!supervisor) throw new DomainError("supervisor", 400, "Supervisor não encontrado.");
      assertCanLead(requirePosition(supervisor.position));
    }
    const input = { name, description: optionalString(source, "description"), supervisorId };
    return id ? this.teams.update(id, input) : this.teams.create(input);
  }

  private async requireTeam(id: string) {
    const team = await this.teams.find(id);
    if (!team) throw new DomainError("not_found", 404, "Equipe não encontrada.");
    return team;
  }

  private async requireMember(id: string) {
    const member = await this.members.find(id);
    if (!member) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    return member;
  }
}
