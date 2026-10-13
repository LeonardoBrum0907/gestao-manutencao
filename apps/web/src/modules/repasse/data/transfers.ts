import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PdiItemDto, TransferCreateBody, TransferDetailDto, TransferListDto, TransferSuggestionDto, TransferSummaryDto } from "@manutencao/shared";
import { api } from "../../../app/http";

const KEY = ["transfers"] as const;

// O repassado sai das notas da matriz, que mudam em outra tela: sempre confere com o servidor ao abrir.
const LIVE = { staleTime: 0 } as const;

export function useTransfers() {
  return useQuery({ queryKey: KEY, queryFn: () => api<TransferListDto>("/api/transfers"), ...LIVE });
}

export function useTransfer(id: string) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => api<TransferDetailDto>(`/api/transfers/${id}`), enabled: Boolean(id), ...LIVE });
}

export function useTransferSuggestions(teacherId: string, equipmentIds: readonly string[] | null) {
  const query = new URLSearchParams({ teacherId });
  if (equipmentIds?.length) query.set("equipmentIds", equipmentIds.join(","));
  return useQuery({
    queryKey: [...KEY, "suggestions", query.toString()],
    queryFn: () => api<TransferSuggestionDto>(`/api/transfers/suggestions?${query.toString()}`),
    enabled: Boolean(teacherId),
    placeholderData: (previous) => previous,
    ...LIVE,
  });
}

export function useCreateTransfer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: TransferCreateBody) => api<TransferSummaryDto>("/api/transfers", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCloseTransfer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/transfers/${id}/close`, { method: "POST" }),
    onSuccess: () => client.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveTransfer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/transfers/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => {
      client.removeQueries({ queryKey: [...KEY, id] });
      void client.invalidateQueries({ queryKey: KEY });
    },
  });
}

export type GapPdiInput = { learnerId: string; teacherId: string; skillId: string; title: string };

// "+ PDI" do que falta repassar: item no PDI de quem aprende, com a habilidade e quem ensina de padrinho.
export function useCreateGapPdi(transferId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ learnerId, teacherId, skillId, title }: GapPdiInput) =>
      api<PdiItemDto>(`/api/members/${learnerId}/pdi/items`, {
        method: "POST",
        body: JSON.stringify({ title, skillId, competencyId: null, lineId: null, responsibleId: teacherId, dueDate: null, status: "planned", notes: null }),
      }),
    onSuccess: (_item, input) => {
      void client.invalidateQueries({ queryKey: [...KEY, transferId] });
      void client.invalidateQueries({ queryKey: ["pdi-items", input.learnerId] });
    },
  });
}
