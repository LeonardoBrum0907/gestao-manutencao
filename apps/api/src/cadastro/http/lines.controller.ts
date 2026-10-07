import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Lines } from "../application/lines";

@Controller("api/lines")
export class LinesController {
  constructor(private readonly lines: Lines) {}

  @Get()
  list() {
    return this.lines.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.lines.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.lines.update(id, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.lines.remove(id);
    return { ok: true };
  }
}
