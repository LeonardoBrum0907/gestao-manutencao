import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { Factories } from "../application/factories";
import { removalCheck } from "../../kernel/removal";

@Controller("api/factories")
export class FactoriesController {
  constructor(private readonly factories: Factories) {}

  @Get()
  list() {
    return this.factories.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.factories.create(body);
  }

  @Patch(":id")
  rename(@Param("id") id: string, @Body() body: unknown) {
    return this.factories.rename(id, body);
  }

  @Get(":id/removal")
  removal(@Param("id") id: string) {
    return removalCheck(() => this.factories.checkRemoval(id));
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.factories.remove(id);
    return { ok: true };
  }
}
