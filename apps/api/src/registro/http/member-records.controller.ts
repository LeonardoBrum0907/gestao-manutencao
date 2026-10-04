import { Controller, Get, Param } from "@nestjs/common";
import { RecordsList } from "../application/records-list";

@Controller("api/members/:memberId/records")
export class MemberRecordsController {
  constructor(private readonly records: RecordsList) {}

  @Get("summary")
  summary(@Param("memberId") memberId: string) {
    return this.records.memberSummary(memberId);
  }
}
