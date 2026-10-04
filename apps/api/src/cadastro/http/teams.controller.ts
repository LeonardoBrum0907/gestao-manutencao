import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { Teams } from "../application/teams";

@Controller("api/teams")
export class TeamsController {
  constructor(private readonly teams: Teams) {}

  @Get()
  list() {
    return this.teams.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.teams.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.teams.update(id, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.teams.remove(id);
    return { ok: true };
  }

  @Put(":id/members/:memberId")
  async addMember(@Param("id") id: string, @Param("memberId") memberId: string) {
    await this.teams.addMember(id, memberId);
    return { ok: true };
  }

  @Delete(":id/members/:memberId")
  async removeMember(@Param("id") id: string, @Param("memberId") memberId: string) {
    await this.teams.removeMember(id, memberId);
    return { ok: true };
  }
}
