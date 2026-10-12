import { useQuery } from "@tanstack/react-query";
import type { DashboardOverviewDto, OverdueCountDto } from "@manutencao/shared";
import { api } from "../../../app/http";
import { overviewApiQuery, type OverviewFilter } from "../model/overview-filter";

export function useDashboardOverview(filter: OverviewFilter) {
  return useQuery({
    queryKey: ["dashboard", "overview", filter.days, filter.factoryId],
    queryFn: () => api<DashboardOverviewDto>(`/api/dashboard/overview?${overviewApiQuery(filter)}`),
  });
}

// O selo da barra lateral está em todas as telas: só a contagem, não o painel inteiro.
export function useOverdueCount() {
  return useQuery({
    queryKey: ["dashboard", "overdue"],
    queryFn: () => api<OverdueCountDto>("/api/dashboard/overdue-count"),
  });
}
