import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { MemberBehavior } from "../application/member-behavior";

@Controller("api/members/:memberId/behavior")
export class BehaviorController {
  constructor(private readonly behavior: MemberBehavior) {}

  @Get()
  show(@Param("memberId") memberId: string) {
    return this.behavior.show(memberId);
  }

  @Put()
  save(@Param("memberId") memberId: string, @Body() body: unknown) {
    return this.behavior.save(memberId, body);
  }
}
