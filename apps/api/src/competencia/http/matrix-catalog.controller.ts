import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { removalCheck } from "../../kernel/removal";
import { MatrixCatalog } from "../application/matrix-catalog";

@Controller("api/matrix-catalog")
export class MatrixCatalogController {
  constructor(private readonly catalog: MatrixCatalog) {}

  @Get()
  show() {
    return this.catalog.show();
  }

  @Post("equipments")
  createEquipment(@Body() body: unknown) {
    return this.catalog.createEquipment(body);
  }

  @Put("equipments/order")
  reorderEquipments(@Body() body: unknown) {
    return this.catalog.reorderEquipments(body);
  }

  @Patch("equipments/:id")
  updateEquipment(@Param("id") id: string, @Body() body: unknown) {
    return this.catalog.updateEquipment(id, body);
  }

  @Get("equipments/:id/removal")
  equipmentRemoval(@Param("id") id: string) {
    return removalCheck(() => this.catalog.checkEquipmentRemoval(id));
  }

  @Delete("equipments/:id")
  async removeEquipment(@Param("id") id: string) {
    await this.catalog.removeEquipment(id);
    return { ok: true };
  }

  @Put("equipments/:id/skills/order")
  reorderSkills(@Param("id") id: string, @Body() body: unknown) {
    return this.catalog.reorderSkills(id, body);
  }

  @Post("skills")
  createSkill(@Body() body: unknown) {
    return this.catalog.createSkill(body);
  }

  @Patch("skills/:id")
  updateSkill(@Param("id") id: string, @Body() body: unknown) {
    return this.catalog.updateSkill(id, body);
  }

  @Delete("skills/:id")
  async removeSkill(@Param("id") id: string) {
    await this.catalog.removeSkill(id);
    return { ok: true };
  }
}
