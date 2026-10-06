import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PdiItemDto } from "@manutencao/shared";
import { api } from "../../../app/http";
import type { PdiItemWrite } from "../model/pdi-items";

export function usePdiItems(memberId: string) {
  return useQuery({
    queryKey: ["pdi-items", memberId],
    queryFn: () => api<PdiItemDto[]>(`/api/members/${memberId}/pdi/items`),
  });
}

export function useSavePdiItem(memberId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id?: string } & Partial<PdiItemWrite>) =>
      api<PdiItemDto>(`/api/members/${memberId}/pdi/items${id ? `/${id}` : ""}`, {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["pdi-items", memberId] }),
  });
}

export function useRemovePdiItem(memberId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => api(`/api/members/${memberId}/pdi/items/${itemId}`, { method: "DELETE" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["pdi-items", memberId] }),
  });
}
