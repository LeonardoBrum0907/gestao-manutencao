import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MemberPerformanceDto, PerformanceScore, Quarter } from "@manutencao/shared";
import { api } from "../../../app/http";

export function usePerformance(memberId: string, year: number) {
  return useQuery({
    queryKey: ["performance", memberId, year],
    queryFn: () => api<MemberPerformanceDto>(`/api/members/${memberId}/performance?year=${year}`),
    placeholderData: (previous) => previous,
  });
}

export type ScoreWrite = { quarter: Quarter; competencyId: string; score: PerformanceScore | null };

export function useSetScore(memberId: string, year: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ quarter, competencyId, score }: ScoreWrite) =>
      api<MemberPerformanceDto>(`/api/members/${memberId}/performance/${year}/${quarter}/${competencyId}`, {
        method: "PUT",
        body: JSON.stringify({ score }),
      }),
    // Marca na hora (as médias chegam com a resposta); se a API recusar, volta ao que estava.
    onMutate: async ({ quarter, competencyId, score }) => {
      await client.cancelQueries({ queryKey: ["performance", memberId, year] });
      const previous = client.getQueryData<MemberPerformanceDto>(["performance", memberId, year]);
      if (previous) {
        const others = previous.entries.filter((entry) => !(entry.competencyId === competencyId && entry.quarter === quarter));
        client.setQueryData<MemberPerformanceDto>(["performance", memberId, year], {
          ...previous,
          entries: score === null ? others : [...others, { competencyId, quarter, score }],
        });
      }
      return { previous };
    },
    onError: (_error, _write, context) => {
      if (context?.previous) client.setQueryData(["performance", memberId, year], context.previous);
    },
    onSuccess: (performance) => client.setQueryData(["performance", memberId, year], performance),
  });
}
