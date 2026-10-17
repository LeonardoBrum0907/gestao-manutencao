import { Body, Controller, Get, Put, Query } from "@nestjs/common";
import { TeamMatrix } from "../application/team-matrix";
import { optionalCategory } from "../domain/catalog";

@Controller("api/team-matrix")
export class TeamMatrixController {
  constructor(private readonly team: TeamMatrix) {}

  // ?categoria=mechanical|electrical filtra; sem ele vem a equipe toda.
  @Get()
  show(@Query("categoria") category?: string) {
    return this.team.show(optionalCategory(category));
  }

  @Put("layout")
  saveLayout(@Body() body: unknown) {
    return this.team.saveLayout(body);
  }
}
