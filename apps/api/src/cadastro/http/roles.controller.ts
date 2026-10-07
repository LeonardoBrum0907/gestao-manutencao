import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Roles } from "../application/roles";
import { removalCheck } from "../../kernel/removal";

@Controller("api/member-roles")
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

  @Get(":id/removal")
  removal(@Param("id") id: string) {
    return removalCheck(() => this.roles.checkRemoval(id));
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.roles.remove(id);
    return { ok: true };
  }
}
