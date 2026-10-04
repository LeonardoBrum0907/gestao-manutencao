import { useRef } from "react";
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type {
  AttachmentDto,
  FeedbackTone,
  RecordDto,
  RecordListItemDto,
  RecordPageDto,
  RecordPriority,
  RecordStatus,
  RecordType,
} from "@manutencao/shared";
import { api } from "../../../app/http";
import { followUpSearch, type FollowUpQuery } from "../model/follow-up";

const PAGE_SIZE = 50;

// Listas de registros crescem sem limite: vêm 50 por vez, com os filtros aplicados no servidor.
export function useRecordPages(scope: string, params: URLSearchParams, options: { enabled?: boolean } = {}) {
  const search = params.toString();
  return useInfiniteQuery({
    queryKey: ["records", "list", scope, search],
    queryFn: ({ pageParam }) => {
      const query = new URLSearchParams(params);
      query.set("limit", String(PAGE_SIZE));
      if (pageParam) query.set("cursor", pageParam);
      return api<RecordPageDto>(`/api/records?${query}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    // Trocar o filtro mantém a lista anterior na tela até a nova chegar.
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function flattenPages(pages: RecordPageDto[] | undefined): RecordListItemDto[] {
  return pages?.flatMap((page) => page.items) ?? [];
}

export function useFollowUp(query: FollowUpQuery) {
  return useRecordPages("follow-up", followUpSearch(query));
}

// Em aberto nas máquinas que o técnico apadrinha (aba PDI).
export function useOpenRecordsOfMachines(machineIds: string[]) {
  const params = new URLSearchParams({ machineIds: [...machineIds].sort().join(","), status: "open,in_progress" });
  return useRecordPages("machines", params, { enabled: machineIds.length > 0 });
}

const fetchRecord = (id: string) => api<RecordDto>(`/api/records/${id}`);

export function useRecord(id: string) {
  return useQuery({
    queryKey: ["records", id],
    queryFn: () => fetchRecord(id),
  });
}

// Parar o mouse (ou focar) numa linha já busca a ficha: quando o clique vem, ela abre sem esperar.
// O atraso evita uma busca por linha quando o mouse só passa por cima da lista.
export function usePrefetchRecord() {
  const client = useQueryClient();
  const timer = useRef<number | undefined>(undefined);
  return {
    start(id: string) {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(
        () => void client.prefetchQuery({ queryKey: ["records", id], queryFn: () => fetchRecord(id) }),
        150,
      );
    },
    cancel() {
      window.clearTimeout(timer.current);
    },
  };
}

// Depois de gravar uma ficha o cache dela já está certo (vem da resposta): refaz as listas, não a ficha.
export function invalidateRecords(client: QueryClient, savedId?: string) {
  void client.invalidateQueries({
    queryKey: ["records"],
    predicate: (query) => query.queryKey[1] !== savedId,
  });
  void client.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useCaptureRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: RecordType; body: string; occurredAt: string; memberId: string | null; tone?: FeedbackTone | null }) =>
      api<RecordDto>("/api/records", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidateRecords(client),
  });
}

export type TaskSheetBody = {
  body: string;
  occurredAt: string;
  status: RecordStatus;
  memberId: string | null;
  factoryId: string | null;
  tag: string | null;
  line: string | null;
  priority: RecordPriority | null;
  dueAt: string | null;
  notes: string | null;
};

export type FeedbackSheetBody = {
  body: string;
  occurredAt: string;
  memberId: string | null;
  tone: FeedbackTone | null;
};

export type ProblemSheetBody = {
  body: string;
  occurredAt: string;
  memberId: string | null;
  machineId: string | null;
  machineLabel: string | null;
  notes: string | null;
};

export function useUpdateRecord(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: TaskSheetBody | FeedbackSheetBody | ProblemSheetBody) =>
      api<RecordDto>(`/api/records/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: (record) => {
      client.setQueryData(["records", id], record);
      invalidateRecords(client, id);
    },
  });
}

export function useAddAttachment(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append("file", file);
      return api<AttachmentDto>(`/api/records/${id}/attachments`, { method: "POST", body });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["records", id] });
    },
  });
}

export function useRemoveAttachment(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => api(`/api/records/${id}/attachments/${attachmentId}`, { method: "DELETE" }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["records", id] });
    },
  });
}
