import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Grades } from "../application/grades";

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

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.grades.remove(id);
    return { ok: true };
  }
}
