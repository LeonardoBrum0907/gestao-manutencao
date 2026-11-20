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

// Feedback é anotação sobre a pessoa, não pendência: tem a própria lista, que inclui as observações
// gravadas na ficha (essas não aparecem em Registros).
// Os concluídos só são buscados quando a seção é aberta.
export function useMemberRecordList(memberId: string, kind: "open" | "done" | "feedback", enabled = true) {
  const params = new URLSearchParams();
  if (kind === "feedback") return useRecordPages("member-feedback", params, { enabled, path: `/api/members/${memberId}/records/feedbacks` });
  params.set("memberId", memberId);
  params.set("type", "task,problem");
  params.set("status", kind === "open" ? "open,in_progress" : "done");
  return useRecordPages(`member-${kind}`, params, { enabled });
}

export type ObservationBody = { body: string; occurredAt: string; tone: FeedbackTone | null };

/**
 * Grava a observação da ficha: feedback da pessoa que fica só na ficha, fora de Registros.
 * @example useCaptureObservation(member.id).mutate({ body, occurredAt, tone })
 */
export function useCaptureObservation(memberId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ObservationBody) =>
      api<RecordDto>(`/api/members/${memberId}/records/observations`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidateRecords(client),
  });
}
