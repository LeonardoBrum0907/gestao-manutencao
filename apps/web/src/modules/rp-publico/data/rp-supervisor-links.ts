import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RpSupervisorLinkDto } from "@manutencao/shared";
import { api } from "../../../app/http";

// Configurações (com login): o link de cada supervisor na página pública de RPs.

const KEY = ["rp-supervisor-links"];
const PATH = "/api/rp-supervisor-links";

export function useSupervisorLinks() {
  return useQuery({ queryKey: KEY, queryFn: () => api<RpSupervisorLinkDto[]>(PATH) });
}

function useRefreshAfter<T>(mutationFn: (input: T) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => client.invalidateQueries({ queryKey: KEY }) });
}

export function useCreateSupervisorLink() {
  return useRefreshAfter((name: string) => api<RpSupervisorLinkDto>(PATH, { method: "POST", body: JSON.stringify({ name }) }));
}

export function useReplaceSupervisorLink() {
  return useRefreshAfter((id: string) => api<RpSupervisorLinkDto>(`${PATH}/${id}/replace`, { method: "POST" }));
}

export function useRevokeSupervisorLink() {
  return useRefreshAfter((id: string) => api<void>(`${PATH}/${id}`, { method: "DELETE" }));
}
