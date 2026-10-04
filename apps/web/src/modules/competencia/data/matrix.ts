import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CompetencyScore, MemberMatrixDto } from "@manutencao/shared";
import { api } from "../../../app/http";

export type SkillWrite = {
  skillId: string;
  score: CompetencyScore | null;
  notApplicable: boolean;
  expected: CompetencyScore | null;
};

export function useMatrix(memberId: string | undefined) {
  return useQuery({
    queryKey: ["matrix", memberId],
    queryFn: () => api<MemberMatrixDto>(`/api/members/${memberId}/matrix`),
    enabled: Boolean(memberId),
  });
}

export function useSetMatrixEquipments(memberId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (equipments: string[]) =>
      api<MemberMatrixDto>(`/api/members/${memberId}/matrix/equipments`, {
        method: "PUT",
        body: JSON.stringify({ equipments }),
      }),
    onSuccess: (matrix) => client.setQueryData(["matrix", memberId], matrix),
  });
}

export function useSetSkill(memberId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, ...body }: SkillWrite) =>
      api<MemberMatrixDto>(`/api/members/${memberId}/matrix/skills/${skillId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: (matrix) => client.setQueryData(["matrix", memberId], matrix),
  });
}
