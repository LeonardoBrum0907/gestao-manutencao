import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BehaviorTagDto, BehaviorTagGroup } from "@manutencao/shared";
import { REFERENCE_DATA } from "../../../app/cache";
import { api } from "../../../app/http";

// A aba Comportamento da ficha mostra estas opções: mudou o cadastro, recarrega as duas.
function invalidate(client: ReturnType<typeof useQueryClient>) {
  client.invalidateQueries({ queryKey: ["behavior-tags"] });
  client.invalidateQueries({ queryKey: ["behavior"] });
}

export function useBehaviorTags() {
  return useQuery({
    queryKey: ["behavior-tags"],
    ...REFERENCE_DATA,
    queryFn: () => api<BehaviorTagDto[]>("/api/behavior-tags"),
  });
}

export function useSaveBehaviorTag() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; group: BehaviorTagGroup; name: string; archived: boolean }) =>
      input.id
        ? api<BehaviorTagDto>(`/api/behavior-tags/${input.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: input.name, archived: input.archived }),
          })
        : api<BehaviorTagDto>("/api/behavior-tags", {
            method: "POST",
            body: JSON.stringify({ group: input.group, name: input.name }),
          }),
    onSuccess: () => invalidate(client),
  });
}

export function useReorderBehaviorTags() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { group: BehaviorTagGroup; ids: string[] }) =>
      api<BehaviorTagDto[]>("/api/behavior-tags/order", { method: "PUT", body: JSON.stringify(input) }),
    // Troca na hora dentro da categoria; se a API recusar, volta ao que estava.
    onMutate: async ({ group, ids }) => {
      await client.cancelQueries({ queryKey: ["behavior-tags"] });
      const previous = client.getQueryData<BehaviorTagDto[]>(["behavior-tags"]);
      if (previous) {
        const byId = new Map(previous.map((item) => [item.id, item]));
        const reordered = ids.flatMap((id) => byId.get(id) ?? []);
        let next = 0;
        client.setQueryData(
          ["behavior-tags"],
          previous.map((item) => (item.group === group ? (reordered[next++] ?? item) : item)),
        );
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) client.setQueryData(["behavior-tags"], context.previous);
    },
    onSettled: () => invalidate(client),
  });
}

export function useDeleteBehaviorTag() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/behavior-tags/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(client),
  });
}
