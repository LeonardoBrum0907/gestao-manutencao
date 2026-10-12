import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EquipmentVersionDto, MachineDto } from "@manutencao/shared";
import { removeById, REFERENCE_DATA, upsertByName } from "../../../app/cache";
import { api, ApiError } from "../../../app/http";
import { withMachineDefaults } from "../model/machine-spot";

/**
 * Versões de todos os modelos (M092, NMX), na ordem do cadastro dentro de cada modelo.
 * Com a API antiga (rota ainda não existe), volta lista vazia em vez de erro.
 * @example const versions = useEquipmentVersions(); versions.data?.filter((v) => v.equipmentId === id)
 */
export function useEquipmentVersions() {
  return useQuery({
    queryKey: ["equipment-versions"],
    ...REFERENCE_DATA,
    queryFn: async () => {
      try {
        return await api<EquipmentVersionDto[]>("/api/equipment-versions");
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return [];
        throw error;
      }
    },
  });
}

/**
 * Cria ou muda (nome, arquivada) uma versão.
 * @example useSaveVersion().mutate({ equipmentId: "blis", name: "NMX", archived: false })
 */
export function useSaveVersion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; equipmentId: string; name: string; archived: boolean }) =>
      input.id
        ? api<EquipmentVersionDto>(`/api/equipment-versions/${input.id}`, { method: "PATCH", body: JSON.stringify({ name: input.name, archived: input.archived }) })
        : api<EquipmentVersionDto>("/api/equipment-versions", { method: "POST", body: JSON.stringify({ equipmentId: input.equipmentId, name: input.name }) }),
    onSuccess: (version) => upsertByName(client, ["equipment-versions"], version),
  });
}

export function useDeleteVersion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/equipment-versions/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => removeById<EquipmentVersionDto>(client, ["equipment-versions"], id),
  });
}

type HiddenInput = { machineId: string; ids: string[] };

/**
 * Grava a lista inteira de subconjuntos que a máquina não tem.
 * A caixa muda na hora (pelo túnel a resposta demora) e volta ao que era se a API recusar.
 * @example useSetHiddenSubassemblies().mutate({ machineId: "m1", ids: ["s3"] })
 */
export function useSetHiddenSubassemblies() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: HiddenInput) =>
      withMachineDefaults(
        await api<MachineDto>(`/api/machines/${input.machineId}/hidden-subassemblies`, { method: "PUT", body: JSON.stringify({ ids: input.ids }) }),
      ),
    onMutate: (input) => {
      const before = client.getQueryData<MachineDto[]>(["machines"]);
      client.setQueryData<MachineDto[]>(["machines"], (list) => list && withHiddenIds(list, input));
      return { before };
    },
    onError: (_error, _input, context) => client.setQueryData(["machines"], context?.before),
    onSuccess: (machine) => upsertByName(client, ["machines"], machine),
  });
}

function withHiddenIds(machines: MachineDto[], input: HiddenInput): MachineDto[] {
  return machines.map((machine) => (machine.id === input.machineId ? { ...machine, hiddenSubassemblyIds: input.ids } : machine));
}
