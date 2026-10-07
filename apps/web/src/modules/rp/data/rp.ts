import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { RpDraftDto, RpDto, RpDuplicateDto, RpFields, RpListItemDto, RpMemberSummaryDto, RpPageDto } from "@manutencao/shared";
import { api } from "../../../app/http";
import { invalidateRecords } from "../../registro/data/records";

const PAGE_SIZE = 50;

// chamadoId só na criação: o RP escrito a partir de um chamado fica ligado a ele.
export type RpBody = RpFields & { rawText: string; excludeId?: string; chamadoId?: string };

export function useRpPages(params: URLSearchParams) {
  const search = params.toString();
  return useInfiniteQuery({
    queryKey: ["rp", "list", search],
    queryFn: ({ pageParam }) => {
      const query = new URLSearchParams(params);
      query.set("limit", String(PAGE_SIZE));
      if (pageParam) query.set("cursor", pageParam);
      return api<RpPageDto>(`/api/rp?${query}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
  });
}

export function flattenRp(pages: RpPageDto[] | undefined): RpListItemDto[] {
  return pages?.flatMap((page) => page.items) ?? [];
}

export function useRp(id: string) {
  return useQuery({ queryKey: ["rp", id], queryFn: () => api<RpDto>(`/api/rp/${id}`) });
}

export function useRpOfProblem(recordId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["rp", "by-problem", recordId],
    queryFn: () => api<{ id: string }>(`/api/rp/by-problem/${recordId}`),
    enabled,
  });
}

export function useMemberRp(memberId: string) {
  return useQuery({
    queryKey: ["rp", "member", memberId],
    queryFn: () => api<RpMemberSummaryDto>(`/api/members/${memberId}/rp`),
  });
}

export function useParseRp() {
  return useMutation({
    mutationFn: (text: string) => api<RpDraftDto[]>("/api/rp/parse", { method: "POST", body: JSON.stringify({ text }) }),
  });
}

export function useCheckDuplicate() {
  return useMutation({
    mutationFn: (body: RpBody) => api<RpDuplicateDto[]>("/api/rp/check-duplicate", { method: "POST", body: JSON.stringify(body) }),
  });
}

// O RP gravado já traz o Problema espelho: as listas de RP e de registros ficam velhas.
function invalidateRp(client: QueryClient, rp?: RpDto, goneId?: string) {
  if (rp) client.setQueryData(["rp", rp.id], rp);
  // A ficha apagada não pode ser buscada de novo: só as listas ficam velhas.
  void client.invalidateQueries({ queryKey: ["rp"], predicate: (query) => query.queryKey[1] !== goneId });
  invalidateRecords(client);
}

export function useSaveRp(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: RpBody) =>
      id
        ? api<RpDto>(`/api/rp/${id}`, { method: "PATCH", body: JSON.stringify(body) })
        : api<RpDto>("/api/rp", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (rp) => invalidateRp(client, rp),
  });
}

export function useDeleteRp() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/rp/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => {
      invalidateRp(client, undefined, id);
    },
  });
}
