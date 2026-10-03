import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CompetencyScore, TechnicianMatrixDto } from "@manutencao/shared";
import { api } from "../../../app/http";

export type SkillWrite = {
  skillId: string;
  score: CompetencyScore | null;
  notApplicable: boolean;
  expected: CompetencyScore | null;
};

export function useMatrix(technicianId: string | undefined) {
  return useQuery({
    queryKey: ["matrix", technicianId],
    queryFn: () => api<TechnicianMatrixDto>(`/api/technicians/${technicianId}/matrix`),
    enabled: Boolean(technicianId),
  });
}

export function useSetMatrixEquipments(technicianId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (equipments: string[]) =>
      api<TechnicianMatrixDto>(`/api/technicians/${technicianId}/matrix/equipments`, {
        method: "PUT",
        body: JSON.stringify({ equipments }),
      }),
    onSuccess: (matrix) => client.setQueryData(["matrix", technicianId], matrix),
  });
}

export function useSetSkill(technicianId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, ...body }: SkillWrite) =>
      api<TechnicianMatrixDto>(`/api/technicians/${technicianId}/matrix/skills/${skillId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: (matrix) => client.setQueryData(["matrix", technicianId], matrix),
  });
}
