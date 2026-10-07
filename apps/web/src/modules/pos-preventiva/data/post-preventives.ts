import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { PostPreventiveDto, PostPreventiveFields } from "@manutencao/shared";
import { api } from "../../../app/http";

// Filtros da lista (linha, máquina, subconjunto, técnico, RP, período e "active=true" para só os pontos ligados).
export type PostPreventiveFilter = Partial<Record<"lineId" | "machineId" | "subassemblyId" | "memberId" | "rpId" | "active" | "from" | "to", string>>;

function searchOf(filter: PostPreventiveFilter): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) if (value) query.set(key, value);
  return query.toString();
}

export function usePostPreventives(filter: PostPreventiveFilter, enabled = true) {
  const search = searchOf(filter);
  return useQuery({
    queryKey: ["post-preventives", "list", search],
    queryFn: () => api<PostPreventiveDto[]>(`/api/post-preventives${search ? `?${search}` : ""}`),
    enabled,
  });
}

export function usePostPreventive(id: string) {
  return useQuery({
    queryKey: ["post-preventives", id],
    queryFn: () => api<PostPreventiveDto>(`/api/post-preventives/${id}`),
    enabled: Boolean(id),
  });
}

function invalidate(client: QueryClient, item?: PostPreventiveDto, goneId?: string) {
  if (item) client.setQueryData(["post-preventives", item.id], item);
  // A ficha apagada não pode ser buscada de novo: só as listas ficam velhas.
  void client.invalidateQueries({ queryKey: ["post-preventives"], predicate: (query) => query.queryKey[1] !== goneId });
}

export function useSavePostPreventive(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: PostPreventiveFields) =>
      id
        ? api<PostPreventiveDto>(`/api/post-preventives/${id}`, { method: "PATCH", body: JSON.stringify(body) })
        : api<PostPreventiveDto>("/api/post-preventives", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (item) => invalidate(client, item),
  });
}

export function useDeletePostPreventive() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/post-preventives/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => invalidate(client, undefined, id),
  });
}
