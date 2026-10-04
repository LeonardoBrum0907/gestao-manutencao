import { useQuery } from "@tanstack/react-query";
import type { MemberRecordsDto } from "@manutencao/shared";
import { api } from "../../../app/http";

export function useMemberRecords(memberId: string) {
  return useQuery({
    queryKey: ["records", "member", memberId],
    queryFn: () => api<MemberRecordsDto>(`/api/members/${memberId}/records`),
  });
}
