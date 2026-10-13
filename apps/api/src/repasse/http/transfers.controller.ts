import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { parseIdList } from "../application/parse-transfer";
import { TransferBoard } from "../application/transfer-board";
import { TransferPlanner } from "../application/transfer-planner";

@Controller("api/transfers")
export class TransfersController {
  constructor(
    private readonly board: TransferBoard,
    private readonly planner: TransferPlanner,
  ) {}

  @Get()
  list() {
    return this.board.list();
  }

  // Antes de ":id" para "suggestions" não ser lido como id.
  @Get("suggestions")
  suggestions(@Query("teacherId") teacherId?: string, @Query("equipmentIds") equipmentIds?: string) {
    return this.planner.suggestions(teacherId?.trim() ?? "", parseIdList(equipmentIds));
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.board.detail(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.planner.create(body);
  }

  @Post(":id/close")
  async close(@Param("id") id: string) {
    await this.planner.close(id);
    return { ok: true };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.planner.remove(id);
    return { ok: true };
  }
}
