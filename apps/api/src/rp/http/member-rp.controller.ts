import { Controller, Get, Param } from "@nestjs/common";
import { Rps } from "../application/rps";

@Controller("api/members/:memberId/rp")
export class MemberRpController {
  constructor(private readonly rps: Rps) {}

  @Get()
  summary(@Param("memberId") memberId: string) {
    return this.rps.memberSummary(memberId);
  }
}
