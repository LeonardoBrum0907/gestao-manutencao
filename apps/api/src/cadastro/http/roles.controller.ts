import { Controller, Get } from "@nestjs/common";
import { Roles } from "../application/roles";

@Controller("api/technician-roles")
export class RolesController {
  constructor(private readonly roles: Roles) {}

  @Get()
  list() {
    return this.roles.list();
  }
}
