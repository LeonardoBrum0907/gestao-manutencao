import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { TechCards, type TechCardQuery } from "../application/tech-cards";

@Controller("api/tech-cards")
export class TechCardsController {
  constructor(private readonly cards: TechCards) {}

  @Get()
  search(@Query() query: TechCardQuery) {
    return this.cards.search(query);
  }

  // Contagem por tipo para a tela da máquina (fichas dela, do modelo e da linha).
  @Get("summary")
  summary(@Query("machineId") machineId?: string) {
    return this.cards.summary(machineId?.trim() || null);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.cards.get(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.cards.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.cards.update(id, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.cards.remove(id);
    return { ok: true };
  }
}
