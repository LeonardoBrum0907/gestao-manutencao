import { Body, Controller, Get, Put } from "@nestjs/common";
import { TeamMatrix } from "../application/team-matrix";

@Controller("api/team-matrix")
export class TeamMatrixController {
  constructor(private readonly team: TeamMatrix) {}

  @Get()
  show() {
    return this.team.show();
  }

  @Put("layout")
  saveLayout(@Body() body: unknown) {
    return this.team.saveLayout(body);
  }
}
