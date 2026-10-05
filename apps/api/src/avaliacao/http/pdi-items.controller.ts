import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { MemberPdiItems } from "../application/member-pdi-items";

@Controller("api/members/:memberId/pdi/items")
export class PdiItemsController {
  constructor(private readonly items: MemberPdiItems) {}

  @Get()
  list(@Param("memberId") memberId: string) {
    return this.items.list(memberId);
  }

  @Post()
  create(@Param("memberId") memberId: string, @Body() body: unknown) {
    return this.items.create(memberId, body);
  }

  @Patch(":itemId")
  update(@Param("memberId") memberId: string, @Param("itemId") itemId: string, @Body() body: unknown) {
    return this.items.update(memberId, itemId, body);
  }

  @Delete(":itemId")
  async remove(@Param("memberId") memberId: string, @Param("itemId") itemId: string) {
    await this.items.remove(memberId, itemId);
    return { ok: true };
  }
}
