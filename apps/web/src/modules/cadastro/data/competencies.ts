import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PerformanceCompetencyDto } from "@manutencao/shared";
import { REFERENCE_DATA } from "../../../app/cache";
import { api } from "../../../app/http";

// A avaliação na ficha mostra estas linhas: mudou o cadastro, recarrega as duas.
function invalidate(client: ReturnType<typeof useQueryClient>) {
  client.invalidateQueries({ queryKey: ["performance-competencies"] });
  client.invalidateQueries({ queryKey: ["performance"] });
}

export function usePerformanceCompetencies() {
  return useQuery({
    queryKey: ["performance-competencies"],
    ...REFERENCE_DATA,
    queryFn: () => api<PerformanceCompetencyDto[]>("/api/performance-competencies"),
  });
}

export function useSaveCompetency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; name: string; archived: boolean }) =>
      input.id
        ? api<PerformanceCompetencyDto>(`/api/performance-competencies/${input.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: input.name, archived: input.archived }),
          })
        : api<PerformanceCompetencyDto>("/api/performance-competencies", {
            method: "POST",
            body: JSON.stringify({ name: input.name }),
          }),
    onSuccess: () => invalidate(client),
  });
}

export function useReorderCompetencies() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      api<PerformanceCompetencyDto[]>("/api/performance-competencies/order", { method: "PUT", body: JSON.stringify({ ids }) }),
    onMutate: async (ids) => {
      await client.cancelQueries({ queryKey: ["performance-competencies"] });
      const previous = client.getQueryData<PerformanceCompetencyDto[]>(["performance-competencies"]);
      if (previous) {
        const byId = new Map(previous.map((item) => [item.id, item]));
        client.setQueryData(["performance-competencies"], ids.flatMap((id) => byId.get(id) ?? []));
      }
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) client.setQueryData(["performance-competencies"], context.previous);
    },
    onSettled: () => invalidate(client),
  });
}

export function useDeleteCompetency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/performance-competencies/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidate(client),
  });
}
