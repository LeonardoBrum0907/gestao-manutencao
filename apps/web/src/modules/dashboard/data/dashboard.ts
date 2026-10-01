import { useQuery } from "@tanstack/react-query";
import type { DashboardDto } from "@manutencao/shared";
import { api } from "../../../app/http";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardDto>("/api/dashboard"),
  });
}
