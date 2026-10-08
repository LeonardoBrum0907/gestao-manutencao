import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { BehaviorTags } from "../application/behavior-tags";
import { removalCheck } from "../../kernel/removal";

@Controller("api/behavior-tags")
export class BehaviorTagsController {
  constructor(private readonly tags: BehaviorTags) {}

  @Get()
  list() {
    return this.tags.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.tags.create(body);
  }

  @Put("order")
  reorder(@Body() body: unknown) {
    return this.tags.reorder(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.tags.update(id, body);
  }

  @Get(":id/removal")
  removal(@Param("id") id: string) {
    return removalCheck(() => this.tags.checkRemoval(id));
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.tags.remove(id);
    return { ok: true };
  }
}
