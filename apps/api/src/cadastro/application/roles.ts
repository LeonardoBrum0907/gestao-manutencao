import { Injectable } from "@nestjs/common";
import type { TechnicianRoleDto } from "@manutencao/shared";
import { RoleRepository } from "../infra/role.repository";

@Injectable()
export class Roles {
  constructor(private readonly roles: RoleRepository) {}

  list(): Promise<TechnicianRoleDto[]> {
    return this.roles.list();
  }
}
