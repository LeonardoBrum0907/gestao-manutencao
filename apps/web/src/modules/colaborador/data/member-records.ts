import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FeedbackTone, MemberRecordSummaryDto, RecordDto } from "@manutencao/shared";
import { api } from "../../../app/http";
import { invalidateRecords, useRecordPages } from "../../registro/data/records";

export function useMemberRecordSummary(memberId: string) {
  return useQuery({
    queryKey: ["records", "member", memberId, "summary"],
    queryFn: () => api<MemberRecordSummaryDto>(`/api/members/${memberId}/records/summary`),
  });
}

/**
 * Listas da ficha. Feedback e observação são anotações sobre a pessoa, não pendências: cada um tem a própria lista.
 * "feedback" é o que o gestor gravou na ficha (fica fora de Registros); "observation" são as observações de Registros
 * com a pessoa como alvo (o tipo "feedback" no banco). Os concluídos só são buscados quando a seção é aberta.
 * @example useMemberRecordList(member.id, "feedback")
 */
export function useMemberRecordList(memberId: string, kind: "open" | "done" | "feedback" | "observation", enabled = true) {
  const params = new URLSearchParams();
  if (kind === "feedback") return useRecordPages("member-feedback", params, { enabled, path: `/api/members/${memberId}/records/feedbacks` });
  params.set("memberId", memberId);
  if (kind === "observation") params.set("type", "feedback");
  else {
    params.set("type", "task,problem");
    params.set("status", kind === "open" ? "open,in_progress" : "done");
  }
  return useRecordPages(`member-${kind}`, params, { enabled });
}

export type MemberFeedbackBody = { body: string; occurredAt: string; tone: FeedbackTone | null };

/**
 * Grava o feedback da ficha: fica só na ficha, fora de Registros.
 * @example useGiveMemberFeedback(member.id).mutate({ body, occurredAt, tone })
 */
export function useGiveMemberFeedback(memberId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: MemberFeedbackBody) =>
      api<RecordDto>(`/api/members/${memberId}/records/feedbacks`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidateRecords(client),
  });
}
