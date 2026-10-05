import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import type { RpListQuery } from "../application/parse-rp-list";
import { Rps } from "../application/rps";

@Controller("api/rp")
export class RpController {
  constructor(private readonly rps: Rps) {}

  @Get()
  page(@Query() query: RpListQuery) {
    return this.rps.page(query);
  }

  @Post("parse")
  parse(@Body() body: unknown) {
    return this.rps.parse(body);
  }

  @Post("check-duplicate")
  checkDuplicate(@Body() body: unknown) {
    return this.rps.checkDuplicate(body);
  }

  @Get("by-problem/:recordId")
  byProblem(@Param("recordId") recordId: string) {
    return this.rps.byProblem(recordId);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.rps.get(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.rps.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.rps.update(id, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.rps.remove(id);
    return { ok: true };
  }
}
