import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RecordDto, RecordStatus } from "@manutencao/shared";
import { api } from "../../../app/http";

export type ChamadoBody = {
  dayNumber: number;
  body: string;
  openedAt: string | null;
  closedAt: string | null;
  durationMin: number | null;
  memberIds: string[];
  machineId: string | null;
  machineLabel: string | null;
  status: RecordStatus;
  notes: string | null;
};

export type OcorrenciaBody = {
  factoryId: string;
  line: string;
  body: string;
};

export function useSaveChamado(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: ChamadoBody) =>
      id
        ? api<RecordDto>(`/api/turno/chamados/${id}`, { method: "PATCH", body: JSON.stringify(body) })
        : api<RecordDto>("/api/turno/chamados", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (record) => {
      client.setQueryData(["records", record.id], record);
      void client.invalidateQueries({ queryKey: ["records"] });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useSaveOcorrencia(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: OcorrenciaBody) =>
      id
        ? api<RecordDto>(`/api/turno/ocorrencias/${id}`, { method: "PATCH", body: JSON.stringify(body) })
        : api<RecordDto>("/api/turno/ocorrencias", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (record) => {
      client.setQueryData(["records", record.id], record);
      void client.invalidateQueries({ queryKey: ["records"] });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
