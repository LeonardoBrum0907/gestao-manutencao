import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Members } from "../application/members";

@Controller("api/members")
export class MembersController {
  constructor(private readonly members: Members) {}

  @Get()
  list() {
    return this.members.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.members.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.members.update(id, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.members.remove(id);
    return { ok: true };
  }
}
