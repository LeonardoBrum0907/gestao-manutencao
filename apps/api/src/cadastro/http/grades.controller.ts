import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Grades } from "../application/grades";
import { removalCheck } from "../../kernel/removal";

@Controller("api/member-grades")
export class GradesController {
  constructor(private readonly grades: Grades) {}

  @Get()
  list() {
    return this.grades.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.grades.create(body);
  }

  @Patch(":id")
  rename(@Param("id") id: string, @Body() body: unknown) {
    return this.grades.rename(id, body);
  }

  @Get(":id/removal")
  removal(@Param("id") id: string) {
    return removalCheck(() => this.grades.checkRemoval(id));
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.grades.remove(id);
    return { ok: true };
  }
}
