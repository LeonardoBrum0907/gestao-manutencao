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
    onSuccess: (performance) => client.setQueryData(["performance", memberId, year], performance),
  });
}
