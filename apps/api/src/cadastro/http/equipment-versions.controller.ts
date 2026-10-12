import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { EquipmentVersions } from "../application/equipment-versions";
import { removalCheck } from "../../kernel/removal";

@Controller("api/equipment-versions")
export class EquipmentVersionsController {
  constructor(private readonly versions: EquipmentVersions) {}

  @Get()
  list() {
    return this.versions.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.versions.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.versions.update(id, body);
  }

  @Get(":id/removal")
  removal(@Param("id") id: string) {
    return removalCheck(() => this.versions.checkRemoval(id));
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.versions.remove(id);
    return { ok: true };
  }
}
