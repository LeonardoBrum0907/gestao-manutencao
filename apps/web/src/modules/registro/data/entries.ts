import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RecordDto, RecordListItemDto, RecordPageDto } from "@manutencao/shared";
import { api } from "../../../app/http";
import { refreshRecords } from "./board";

// Rascunhos são para revisar logo: cem abertos já é muito, então vem uma página só.
const ENTRY_LIMIT = 100;

/**
 * Rascunhos da Entrada ainda não revisados, do mais antigo ao mais novo (o novo fica junto do cartão de adicionar).
 * Ex.: `const entries = useEntries(); entries.data?.map(…)`
 */
export function useEntries() {
  return useQuery({
    queryKey: ["records", "entries"],
    queryFn: async (): Promise<RecordListItemDto[]> => {
      const page = await api<RecordPageDto>(`/api/records?type=entry&status=open&limit=${ENTRY_LIMIT}`);
      return [...page.items].reverse();
    },
  });
}

/** Anota um rascunho na Entrada, só com o texto. Ex.: `addEntry.mutate("Ver vazamento na MED 03")` */
export function useAddEntry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api<RecordDto>("/api/records", {
        method: "POST",
        body: JSON.stringify({ type: "entry", body, memberId: null, occurredAt: new Date().toISOString() }),
      }),
    onSettled: () => refreshRecords(client),
  });
}
