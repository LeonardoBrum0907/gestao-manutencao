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

  // Histórico de observações da ficha (feedbacks da pessoa, com os que Registros não mostra).
  @Get("feedbacks")
  feedbacks(@Param("memberId") memberId: string, @Query() query: RecordListQuery) {
    return this.records.memberFeedbacks(memberId, query);
  }

  @Post("observations")
  observe(@Param("memberId") memberId: string, @Body() body: unknown) {
    return this.writer.observe(memberId, body);
  }
}
