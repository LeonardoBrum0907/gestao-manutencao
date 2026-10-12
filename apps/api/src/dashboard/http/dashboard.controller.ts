import { Controller, Get, Query } from "@nestjs/common";
import { ShowDashboard } from "../application/show-dashboard";
import { ShowOverview } from "../application/show-overview";
import type { OverviewQuery } from "../application/parse-overview";

@Controller("api/dashboard")
export class DashboardController {
  constructor(
    private readonly dashboard: ShowDashboard,
    private readonly overview: ShowOverview,
  ) {}

  @Get("overdue-count")
  overdue() {
    return this.dashboard.overdue();
  }

  // Dashboard do coordenador (faixas Agora, Máquinas e Equipe). ?dias=7|30|90&fabrica=<id>
  @Get("overview")
  showOverview(@Query() query: OverviewQuery) {
    return this.overview.execute(query);
  }

  // Resumo antigo: a tela usa /overview, mas o resumo_do_dia do MCP ainda lê este.
  @Get()
  show() {
    return this.dashboard.execute();
  }
}
