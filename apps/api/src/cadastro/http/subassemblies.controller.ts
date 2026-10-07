import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Subassemblies } from "../application/subassemblies";
import { removalCheck } from "../../kernel/removal";

@Controller("api/subassemblies")
export class SubassembliesController {
  constructor(private readonly subassemblies: Subassemblies) {}

  @Get()
  list() {
    return this.subassemblies.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.subassemblies.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.subassemblies.update(id, body);
  }

  @Get(":id/removal")
  removal(@Param("id") id: string) {
    return removalCheck(() => this.subassemblies.checkRemoval(id));
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.subassemblies.remove(id);
    return { ok: true };
  }
}
