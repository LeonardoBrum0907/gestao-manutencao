import { Controller, Get } from "@nestjs/common";
import { OpenRecords } from "../application/open-records";

@Controller("api/dashboard")
export class DashboardController {
  constructor(private readonly openRecords: OpenRecords) {}

  @Get()
  show() {
    return this.openRecords.execute();
  }
}
