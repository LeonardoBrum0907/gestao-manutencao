import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { MemberMatrix } from "../application/member-matrix";

@Controller("api/members/:memberId/matrix")
export class MatrixController {
  constructor(private readonly matrix: MemberMatrix) {}

  @Get()
  show(@Param("memberId") memberId: string) {
    return this.matrix.show(memberId);
  }

  @Put("equipments")
  setEquipments(@Param("memberId") memberId: string, @Body() body: unknown) {
    return this.matrix.setEquipments(memberId, body);
  }

  @Put("skills")
  setSkills(@Param("memberId") memberId: string, @Body() body: unknown) {
    return this.matrix.setSkills(memberId, body);
  }

  @Put("skills/:skillId")
  setSkill(@Param("memberId") memberId: string, @Param("skillId") skillId: string, @Body() body: unknown) {
    return this.matrix.setSkill(memberId, skillId, body);
  }
}
