import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Machines } from "../application/machines";
import { removalCheck } from "../../kernel/removal";

@Controller("api/machines")
export class MachinesController {
  constructor(private readonly machines: Machines) {}

  @Get()
  list() {
    return this.machines.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.machines.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.machines.update(id, body);
  }

  @Get(":id/removal")
  removal(@Param("id") id: string) {
    return removalCheck(() => this.machines.checkRemoval(id));
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.machines.remove(id);
    return { ok: true };
  }
}
