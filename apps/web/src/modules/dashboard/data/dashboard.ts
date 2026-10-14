import { useQuery } from "@tanstack/react-query";
import type { DashboardOverviewDto } from "@manutencao/shared";
import { api } from "../../../app/http";
import { overviewApiQuery, type OverviewFilter } from "../model/overview-filter";

export function useDashboardOverview(filter: OverviewFilter) {
  return useQuery({
    queryKey: ["dashboard", "overview", filter.days, filter.factoryId],
    queryFn: () => api<DashboardOverviewDto>(`/api/dashboard/overview?${overviewApiQuery(filter)}`),
  });
}
