import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { Roles } from "../application/roles";

@Controller("api/technician-roles")
export class RolesController {
  constructor(private readonly roles: Roles) {}

  @Get()
  list() {
    return this.roles.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.roles.create(body);
  }

  @Patch(":id")
  rename(@Param("id") id: string, @Body() body: unknown) {
    return this.roles.rename(id, body);
  }
}
