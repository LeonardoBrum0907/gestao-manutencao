import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { Competencies } from "../application/competencies";

@Controller("api/performance-competencies")
export class CompetenciesController {
  constructor(private readonly competencies: Competencies) {}

  @Get()
  list() {
    return this.competencies.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.competencies.create(body);
  }

  @Put("order")
  reorder(@Body() body: unknown) {
    return this.competencies.reorder(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.competencies.update(id, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.competencies.remove(id);
    return { ok: true };
  }
}
