import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Technicians } from "../application/technicians";

@Controller("api/technicians")
export class TechniciansController {
  constructor(private readonly technicians: Technicians) {}

  @Get()
  list() {
    return this.technicians.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.technicians.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.technicians.update(id, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.technicians.remove(id);
    return { ok: true };
  }
}
