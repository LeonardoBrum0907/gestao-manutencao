import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MemberBehaviorDto } from "@manutencao/shared";
import { api } from "../../../app/http";

export type BehaviorWrite = Omit<MemberBehaviorDto, "memberId">;

export function useBehavior(memberId: string) {
  return useQuery({
    queryKey: ["behavior", memberId],
    queryFn: () => api<MemberBehaviorDto>(`/api/members/${memberId}/behavior`),
  });
}

export function useSaveBehavior(memberId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: BehaviorWrite) =>
      api<MemberBehaviorDto>(`/api/members/${memberId}/behavior`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: (behavior) => client.setQueryData(["behavior", memberId], behavior),
  });
}
