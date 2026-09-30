import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AttachmentDto, RecordDto, RecordPriority, RecordStatus, RecordType } from "@manutencao/shared";
import { api } from "../../../app/http";
import { followUpSearch, type FollowUpQuery } from "../model/follow-up";

export function useRecords() {
  return useQuery({
    queryKey: ["records"],
    queryFn: () => api<RecordDto[]>("/api/records"),
  });
}

export function useFollowUp(query: FollowUpQuery) {
  const search = followUpSearch(query).toString();
  return useQuery({
    queryKey: ["records", "follow-up", search],
    queryFn: () => api<RecordDto[]>(search ? `/api/records?${search}` : "/api/records"),
  });
}

export function useRecord(id: string) {
  return useQuery({
    queryKey: ["records", id],
    queryFn: () => api<RecordDto>(`/api/records/${id}`),
  });
}

export function useCaptureRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: RecordType; body: string; occurredAt: string; technicianId: string | null }) =>
      api<RecordDto>("/api/records", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["records"] }),
  });
}

export type TaskSheetBody = {
  body: string;
  occurredAt: string;
  status: RecordStatus;
  technicianId: string | null;
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
  technicianId: string | null;
};

export type ProblemSheetBody = {
  body: string;
  occurredAt: string;
  technicianId: string | null;
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
      void client.invalidateQueries({ queryKey: ["records"] });
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
