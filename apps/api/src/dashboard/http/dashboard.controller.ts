import { Controller, Get } from "@nestjs/common";
import { ShowDashboard } from "../application/show-dashboard";

@Controller("api/dashboard")
export class DashboardController {
  constructor(private readonly dashboard: ShowDashboard) {}

  @Get("overdue-count")
  overdue() {
    return this.dashboard.overdue();
  }

  @Get()
  show() {
    return this.dashboard.execute();
  }
}
