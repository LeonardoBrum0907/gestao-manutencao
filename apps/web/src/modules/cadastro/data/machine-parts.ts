import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MachineDto } from "@manutencao/shared";
import { upsertByName } from "../../../app/cache";
import { api } from "../../../app/http";
import { withMachineDefaults } from "../model/machine-spot";

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
