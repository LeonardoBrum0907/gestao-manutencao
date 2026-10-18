import { Injectable } from "@nestjs/common";
import type { MemberRoleDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject, requiredString } from "../../kernel/parse";
import { nameOwner, requireName } from "../domain/names";
import { assertRoleNameAvailable } from "../domain/role-name";
import { assertLeadsTeamsChange, requireLeadsTeams } from "../domain/role-leads-teams";
import { requireRoleMatrixCategory } from "../domain/role-matrix-category";
import { assertRoleCanBeRemoved } from "../domain/role-removal";
import { RoleRepository } from "../infra/role.repository";

@Injectable()
export class Roles {
  constructor(private readonly roles: RoleRepository) {}

  list(): Promise<MemberRoleDto[]> {
    return this.roles.list();
  }

  async create(body: unknown): Promise<MemberRoleDto> {
    const name = requireName(requiredString(readObject(body), "name", "Informe o nome da função."), "Informe o nome da função.");
    const owner = nameOwner(await this.roles.list(), name);
    assertRoleNameAvailable(owner?.id ?? null, null);
    return this.roles.create(name);
  }

  async rename(id: string, body: unknown): Promise<MemberRoleDto> {
    const current = await this.roles.find(id);
    if (!current) throw new DomainError("not_found", 404, "Função não encontrada.");
    const name = requireName(requiredString(readObject(body), "name", "Informe o nome da função."), "Informe o nome da função.");
    const owner = nameOwner(await this.roles.list(), name);
    assertRoleNameAvailable(owner?.id ?? null, id);
    return this.roles.rename(id, name);
  }

  // Muda que habilidades da matriz todos os colaboradores desta função veem e contam na aderência.
  async setMatrixCategory(id: string, body: unknown): Promise<MemberRoleDto> {
    if (!(await this.roles.find(id))) throw new DomainError("not_found", 404, "Função não encontrada.");
    return this.roles.setMatrixCategory(id, requireRoleMatrixCategory(body));
  }

  // Liga ou desliga "lidera equipe": o cargo de todos com a função muda junto.
  async setLeadsTeams(id: string, body: unknown): Promise<MemberRoleDto> {
    const current = await this.roles.find(id);
    if (!current) throw new DomainError("not_found", 404, "Função não encontrada.");
    const leadsTeams = requireLeadsTeams(body);
    assertLeadsTeamsChange(current.leadsTeams, leadsTeams, await this.roles.countTeamUse(id));
    return this.roles.setLeadsTeams(id, leadsTeams);
  }

  // As regras da exclusão, sem excluir: a tela pergunta antes de oferecer o botão.
  async checkRemoval(id: string): Promise<void> {
    const current = await this.roles.find(id);
    if (!current) throw new DomainError("not_found", 404, "Função não encontrada.");
    assertRoleCanBeRemoved(await this.roles.countMembers(id));
  }

  async remove(id: string): Promise<void> {
    await this.checkRemoval(id);
    await this.roles.remove(id);
  }
}
