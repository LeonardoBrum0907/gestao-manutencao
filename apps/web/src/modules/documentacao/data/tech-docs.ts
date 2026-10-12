import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { TechCardFields, TechCardHit, TechCardSearchDto, TechCardSummaryDto, TechDocumentDto, TechDocumentFields } from "@manutencao/shared";
import { api } from "../../../app/http";

// Filtros da busca de fichas (?q=&type=&lineId=&machineId=&equipmentId=&subassemblyId=&documentId=&review=).
export type TechCardFilter = Partial<Record<"q" | "type" | "lineId" | "machineId" | "equipmentId" | "subassemblyId" | "documentId" | "review" | "limit", string>>;

function searchOf(filter: TechCardFilter): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) if (value) query.set(key, value);
  return query.toString();
}

export function useTechCardSearch(filter: TechCardFilter, enabled = true) {
  const search = searchOf(filter);
  return useQuery({
    queryKey: ["tech-cards", "search", search],
    queryFn: () => api<TechCardSearchDto>(`/api/tech-cards${search ? `?${search}` : ""}`),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useTechCard(id: string) {
  return useQuery({
    queryKey: ["tech-cards", id],
    queryFn: () => api<TechCardHit>(`/api/tech-cards/${id}`),
    enabled: Boolean(id),
  });
}

// Contagem por tipo da tela da máquina (fichas dela, do modelo e da linha).
export function useTechCardSummary(machineId: string) {
  return useQuery({
    queryKey: ["tech-cards", "summary", machineId],
    queryFn: () => api<TechCardSummaryDto>(`/api/tech-cards/summary?machineId=${encodeURIComponent(machineId)}`),
    enabled: Boolean(machineId),
  });
}

function invalidateCards(client: QueryClient, item?: TechCardHit, goneId?: string) {
  if (item) client.setQueryData(["tech-cards", item.id], item);
  void client.invalidateQueries({ queryKey: ["tech-cards"], predicate: (query) => query.queryKey[1] !== goneId });
  // A contagem de fichas por documento muda junto.
  void client.invalidateQueries({ queryKey: ["tech-documents"] });
}

export function useSaveTechCard(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: TechCardFields) =>
      id
        ? api<TechCardHit>(`/api/tech-cards/${id}`, { method: "PATCH", body: JSON.stringify(body) })
        : api<TechCardHit>("/api/tech-cards", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (item) => invalidateCards(client, item),
  });
}

export function useDeleteTechCard() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/tech-cards/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => invalidateCards(client, undefined, id),
  });
}

export function useTechDocuments(equipmentId?: string) {
  return useQuery({
    queryKey: ["tech-documents", equipmentId ?? ""],
    queryFn: () => api<TechDocumentDto[]>(`/api/tech-documents${equipmentId ? `?equipmentId=${encodeURIComponent(equipmentId)}` : ""}`),
  });
}

// Endereço do PDF no navegador, já na página da ficha (o visor do navegador lê o #page=).
export function techDocumentFileHref(documentId: string, page: number | null): string {
  return `/api/tech-documents/${documentId}/file${page ? `#page=${page}` : ""}`;
}

function invalidateDocuments(client: QueryClient) {
  void client.invalidateQueries({ queryKey: ["tech-documents"] });
}

export function useUploadTechDocument() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: TechDocumentFields & { file: File }) => {
      const body = new FormData();
      body.append("file", input.file);
      body.append("equipmentId", input.equipmentId);
      body.append("name", input.name);
      body.append("kind", input.kind);
      if (input.revision) body.append("revision", input.revision);
      return api<TechDocumentDto>("/api/tech-documents", { method: "POST", body });
    },
    onSuccess: () => invalidateDocuments(client),
  });
}

export function useUpdateTechDocument() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string } & Omit<TechDocumentFields, "equipmentId">) =>
      api<TechDocumentDto>(`/api/tech-documents/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: input.name, kind: input.kind, revision: input.revision }),
      }),
    onSuccess: () => invalidateDocuments(client),
  });
}

export function useDeleteTechDocument() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/tech-documents/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateDocuments(client),
  });
}
