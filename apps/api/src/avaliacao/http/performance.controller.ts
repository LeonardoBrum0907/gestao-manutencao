import { Body, Controller, Get, Param, Put, Query } from "@nestjs/common";
import { MemberPerformance } from "../application/member-performance";

@Controller("api/members/:memberId/performance")
export class PerformanceController {
  constructor(private readonly performance: MemberPerformance) {}

  @Get()
  show(@Param("memberId") memberId: string, @Query("year") year?: string) {
    return this.performance.show(memberId, year);
  }

  @Put(":year/:quarter/:competency")
  setScore(
    @Param("memberId") memberId: string,
    @Param("year") year: string,
    @Param("quarter") quarter: string,
    @Param("competency") competency: string,
    @Body() body: unknown,
  ) {
    return this.performance.setScore(memberId, year, quarter, competency, body);
  }
}
