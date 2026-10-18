import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { PublicRpBody, PublicRpDirectoryDto, PublicRpDto, PublicRpPageDto } from "@manutencao/shared";
import { api } from "../../../app/http";

// Chamadas da página pública: sem login, o código do link vai no caminho.

const PAGE_SIZE = 50;

function base(code: string): string {
  return `/api/public/rp/${encodeURIComponent(code)}`;
}

export function usePublicDirectory(code: string) {
  return useQuery({
    queryKey: ["public-rp", code, "directory"],
    queryFn: () => api<PublicRpDirectoryDto>(`${base(code)}/directory`),
    staleTime: 10 * 60_000,
  });
}

export function usePublicRpPages(code: string, params: URLSearchParams) {
  const search = params.toString();
  return useInfiniteQuery({
    queryKey: ["public-rp", code, "list", search],
    queryFn: ({ pageParam }) => {
      const query = new URLSearchParams(params);
      query.set("limit", String(PAGE_SIZE));
      if (pageParam) query.set("cursor", pageParam);
      return api<PublicRpPageDto>(`${base(code)}?${query}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
  });
}

// Quantos RPs do técnico esperam revisão (até 100, o tamanho de uma página).
export function usePendingReviews(code: string, memberId: string) {
  return useQuery({
    queryKey: ["public-rp", code, "pending", memberId],
    queryFn: () => api<PublicRpPageDto>(`${base(code)}?${new URLSearchParams({ memberId, review: "pending", limit: "100" })}`),
    enabled: Boolean(memberId),
  });
}

export function usePublicRp(code: string, id: string) {
  return useQuery({ queryKey: ["public-rp", code, "rp", id], queryFn: () => api<PublicRpDto>(`${base(code)}/${id}`) });
}

/**
 * Busca a ficha completa de cada RP escolhido para exportar (a lista só traz o resumo).
 * @example const rps = await fetchPublicRps(client, code, ["rp1", "rp2"])
 */
export function fetchPublicRps(client: QueryClient, code: string, ids: string[]): Promise<PublicRpDto[]> {
  return Promise.all(
    ids.map((id) => client.fetchQuery({ queryKey: ["public-rp", code, "rp", id], queryFn: () => api<PublicRpDto>(`${base(code)}/${id}`) })),
  );
}

export function useSavePublicRp(code: string, id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: PublicRpBody) =>
      id
        ? api<PublicRpDto>(`${base(code)}/${id}`, { method: "PATCH", body: JSON.stringify(body) })
        : api<PublicRpDto>(base(code), { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (rp) => {
      client.setQueryData(["public-rp", code, "rp", rp.id], rp);
      void client.invalidateQueries({ queryKey: ["public-rp", code], predicate: (query) => query.queryKey[2] !== "rp" });
    },
  });
}

export function useRequestReview(code: string, id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => api<PublicRpDto>(`${base(code)}/${id}/review-request`, { method: "POST", body: JSON.stringify({ text }) }),
    onSuccess: (rp) => {
      client.setQueryData(["public-rp", code, "rp", rp.id], rp);
      void client.invalidateQueries({ queryKey: ["public-rp", code], predicate: (query) => query.queryKey[2] !== "rp" });
    },
  });
}
