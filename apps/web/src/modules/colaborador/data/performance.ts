import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MemberPerformanceDto, PerformanceCompetency, PerformanceScore, Quarter } from "@manutencao/shared";
import { api } from "../../../app/http";

export function usePerformance(memberId: string, year: number) {
  return useQuery({
    queryKey: ["performance", memberId, year],
    queryFn: () => api<MemberPerformanceDto>(`/api/members/${memberId}/performance?year=${year}`),
    placeholderData: (previous) => previous,
  });
}

export type ScoreWrite = { quarter: Quarter; competency: PerformanceCompetency; score: PerformanceScore | null };

export function useSetScore(memberId: string, year: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ quarter, competency, score }: ScoreWrite) =>
      api<MemberPerformanceDto>(`/api/members/${memberId}/performance/${year}/${quarter}/${competency}`, {
        method: "PUT",
        body: JSON.stringify({ score }),
      }),
    onSuccess: (performance) => client.setQueryData(["performance", memberId, year], performance),
  });
}
