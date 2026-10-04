import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CompetencyLevel, MatrixCatalogDto, MatrixEquipmentDto, MatrixSkillDto } from "@manutencao/shared";
import { REFERENCE_DATA } from "../../../app/cache";
import { api } from "../../../app/http";

export function useMatrixCatalog() {
  return useQuery({
    queryKey: ["matrix-catalog"],
    ...REFERENCE_DATA,
    queryFn: () => api<MatrixCatalogDto>("/api/matrix-catalog"),
  });
}

// A matriz de cada técnico conta pelo cadastro: mudou o cadastro, recarrega as duas.
function useCatalogMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => {
      client.invalidateQueries({ queryKey: ["matrix-catalog"] });
      client.invalidateQueries({ queryKey: ["matrix"] });
    },
  });
}

export function useSaveEquipment() {
  return useCatalogMutation((input: { id?: string; name: string; archived: boolean }) =>
    input.id
      ? api<MatrixEquipmentDto>(`/api/matrix-catalog/equipments/${input.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: input.name, archived: input.archived }),
        })
      : api<MatrixEquipmentDto>("/api/matrix-catalog/equipments", { method: "POST", body: JSON.stringify({ name: input.name }) }),
  );
}

export function useDeleteEquipment() {
  return useCatalogMutation((id: string) => api(`/api/matrix-catalog/equipments/${id}`, { method: "DELETE" }));
}

export function useReorderEquipments() {
  return useCatalogMutation((ids: string[]) =>
    api<MatrixCatalogDto>("/api/matrix-catalog/equipments/order", { method: "PUT", body: JSON.stringify({ ids }) }),
  );
}

export type SkillInput = { equipmentId: string; subgroup: string; text: string; level: CompetencyLevel; archived: boolean };

export function useSaveSkill() {
  return useCatalogMutation((input: SkillInput & { id?: string }) =>
    input.id
      ? api<MatrixSkillDto>(`/api/matrix-catalog/skills/${input.id}`, { method: "PATCH", body: JSON.stringify(input) })
      : api<MatrixSkillDto>("/api/matrix-catalog/skills", { method: "POST", body: JSON.stringify(input) }),
  );
}

export function useDeleteSkill() {
  return useCatalogMutation((id: string) => api(`/api/matrix-catalog/skills/${id}`, { method: "DELETE" }));
}

export function useReorderSkills() {
  return useCatalogMutation(({ equipmentId, ids }: { equipmentId: string; ids: string[] }) =>
    api<MatrixCatalogDto>(`/api/matrix-catalog/equipments/${equipmentId}/skills/order`, {
      method: "PUT",
      body: JSON.stringify({ ids }),
    }),
  );
}
