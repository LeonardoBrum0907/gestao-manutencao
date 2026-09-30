import { Injectable, OnModuleInit } from "@nestjs/common";
import { RoleRepository } from "../infra/role.repository";

@Injectable()
export class SeedRoles implements OnModuleInit {
  constructor(private readonly roles: RoleRepository) {}

  onModuleInit(): Promise<void> {
    return this.roles.ensureSeed();
  }
}
