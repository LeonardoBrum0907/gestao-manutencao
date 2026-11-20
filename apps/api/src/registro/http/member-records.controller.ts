import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import type { RecordListQuery } from "../application/parse-record-list";
import { Records } from "../application/records";
import { RecordsList } from "../application/records-list";

@Controller("api/members/:memberId/records")
export class MemberRecordsController {
  constructor(
    private readonly records: RecordsList,
    private readonly writer: Records,
  ) {}

  @Get("summary")
  summary(@Param("memberId") memberId: string) {
    return this.records.memberSummary(memberId);
  }

  // Cartão Feedbacks da ficha: o que o gestor gravou nela, fora de Registros.
  @Get("feedbacks")
  feedbacks(@Param("memberId") memberId: string, @Query() query: RecordListQuery) {
    return this.records.memberFeedbacks(memberId, query);
  }

  @Post("feedbacks")
  giveFeedback(@Param("memberId") memberId: string, @Body() body: unknown) {
    return this.writer.giveMemberFeedback(memberId, body);
  }
}
