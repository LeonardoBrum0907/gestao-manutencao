import { Controller, Get, Param } from "@nestjs/common";
import { MemberRecords } from "../application/member-records";

@Controller("api/members/:memberId/records")
export class MemberRecordsController {
  constructor(private readonly memberRecords: MemberRecords) {}

  @Get()
  list(@Param("memberId") memberId: string) {
    return this.memberRecords.execute(memberId);
  }
}
