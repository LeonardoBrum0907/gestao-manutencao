import { useQuery } from "@tanstack/react-query";
import type { MemberRecordSummaryDto } from "@manutencao/shared";
import { api } from "../../../app/http";
import { useRecordPages } from "../../registro/data/records";

export function useMemberRecordSummary(memberId: string) {
  return useQuery({
    queryKey: ["records", "member", memberId, "summary"],
    queryFn: () => api<MemberRecordSummaryDto>(`/api/members/${memberId}/records/summary`),
  });
}

// Feedback é anotação sobre a pessoa, não pendência: tem a própria lista.
// Os concluídos só são buscados quando a seção é aberta.
export function useMemberRecordList(memberId: string, kind: "open" | "done" | "feedback", enabled = true) {
  const params = new URLSearchParams({ memberId });
  if (kind === "feedback") params.set("type", "feedback");
  else {
    params.set("type", "task,problem");
    params.set("status", kind === "open" ? "open,in_progress" : "done");
  }
  return useRecordPages(`member-${kind}`, params, { enabled });
}
