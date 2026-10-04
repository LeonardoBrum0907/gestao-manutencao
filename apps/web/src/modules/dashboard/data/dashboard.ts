import { useQuery } from "@tanstack/react-query";
import type { DashboardDto, OverdueCountDto } from "@manutencao/shared";
import { api } from "../../../app/http";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard", "panel"],
    queryFn: () => api<DashboardDto>("/api/dashboard"),
  });
}

// O selo da barra lateral está em todas as telas: só a contagem, não o painel inteiro.
export function useOverdueCount() {
  return useQuery({
    queryKey: ["dashboard", "overdue"],
    queryFn: () => api<OverdueCountDto>("/api/dashboard/overdue-count"),
  });
}
