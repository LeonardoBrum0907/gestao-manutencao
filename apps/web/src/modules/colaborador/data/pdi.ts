import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AttachmentDto, MemberPdiDto } from "@manutencao/shared";
import { api } from "../../../app/http";

export function usePdi(memberId: string) {
  return useQuery({
    queryKey: ["pdi", memberId],
    queryFn: () => api<MemberPdiDto>(`/api/members/${memberId}/pdi`),
  });
}

export function useSetPdiMachines(memberId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { sponsor: string[]; development: string[] }) =>
      api<MemberPdiDto>(`/api/members/${memberId}/pdi/machines`, { method: "PUT", body: JSON.stringify(body) }),
    // Marca na hora; se a API recusar, volta ao que estava.
    onMutate: async (body) => {
      await client.cancelQueries({ queryKey: ["pdi", memberId] });
      const previous = client.getQueryData<MemberPdiDto>(["pdi", memberId]);
      if (previous) {
        client.setQueryData<MemberPdiDto>(["pdi", memberId], {
          ...previous,
          sponsorMachineIds: body.sponsor,
          developmentMachineIds: body.development,
        });
      }
      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) client.setQueryData(["pdi", memberId], context.previous);
    },
    onSuccess: (pdi) => client.setQueryData(["pdi", memberId], pdi),
  });
}

export function useAddPdiFile(memberId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append("file", file);
      return api<AttachmentDto>(`/api/members/${memberId}/pdi/attachments`, { method: "POST", body });
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["pdi", memberId] }),
  });
}

export function useRemovePdiFile(memberId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => api(`/api/members/${memberId}/pdi/attachments/${attachmentId}`, { method: "DELETE" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["pdi", memberId] }),
  });
}
