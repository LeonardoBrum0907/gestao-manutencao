import { Injectable } from "@nestjs/common";
import type { MemberRoleDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject, requiredString } from "../../kernel/parse";
import { requireName } from "../domain/names";
import { assertRoleNameAvailable } from "../domain/role-name";
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
    const owner = await this.roles.findByName(name);
    assertRoleNameAvailable(owner?.id ?? null, null);
    return this.roles.create(name);
  }

  async rename(id: string, body: unknown): Promise<MemberRoleDto> {
    const current = await this.roles.find(id);
    if (!current) throw new DomainError("not_found", 404, "Função não encontrada.");
    const name = requireName(requiredString(readObject(body), "name", "Informe o nome da função."), "Informe o nome da função.");
    const owner = await this.roles.findByName(name);
    assertRoleNameAvailable(owner?.id ?? null, id);
    return this.roles.rename(id, name);
  }

  // As regras da exclusão, sem excluir: a tela pergunta antes de oferecer o botão.
  async checkRemoval(id: string): Promise<void> {
    const current = await this.roles.find(id);
    if (!current) throw new DomainError("not_found", 404, "Função não encontrada.");
    assertRoleCanBeRemoved(current.name, await this.roles.countMembers(id));
  }

  async remove(id: string): Promise<void> {
    await this.checkRemoval(id);
    await this.roles.remove(id);
  }
}
