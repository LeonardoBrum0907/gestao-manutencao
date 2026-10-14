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
  const mutationKey = ["save-behavior", memberId];
  return useMutation({
    mutationKey,
    mutationFn: (body: BehaviorWrite) =>
      api<MemberBehaviorDto>(`/api/members/${memberId}/behavior`, { method: "PUT", body: JSON.stringify(body) }),
    // Marca na hora; se a API recusar, volta ao que estava.
    onMutate: async (body) => {
      await client.cancelQueries({ queryKey: ["behavior", memberId] });
      const previous = client.getQueryData<MemberBehaviorDto>(["behavior", memberId]);
      if (previous) client.setQueryData<MemberBehaviorDto>(["behavior", memberId], { ...previous, ...body });
      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) client.setQueryData(["behavior", memberId], context.previous);
    },
    // Com a lista aberta dá para marcar várias seguidas: a resposta de uma gravação antiga
    // apagaria as marcações mais novas, então só a última a terminar escreve o que a API devolveu.
    onSuccess: (behavior) => {
      if (client.isMutating({ mutationKey }) > 1) return;
      client.setQueryData(["behavior", memberId], behavior);
    },
  });
}
