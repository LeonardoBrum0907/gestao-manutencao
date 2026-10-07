import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { PostPreventives, type PostPreventiveQuery } from "../application/post-preventives";

@Controller("api/post-preventives")
export class PostPreventiveController {
  constructor(private readonly postPreventives: PostPreventives) {}

  @Get()
  list(@Query() query: PostPreventiveQuery) {
    return this.postPreventives.list(query);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.postPreventives.get(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.postPreventives.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.postPreventives.update(id, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.postPreventives.remove(id);
    return { ok: true };
  }
}
