import { Controller, Get } from "@nestjs/common";
import { TeamMatrix } from "../application/team-matrix";

@Controller("api/team-matrix")
export class TeamMatrixController {
  constructor(private readonly team: TeamMatrix) {}

  @Get()
  show() {
    return this.team.show();
  }
}
