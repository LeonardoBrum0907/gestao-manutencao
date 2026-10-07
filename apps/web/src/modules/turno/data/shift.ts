import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChamadoBody, ChamadoDto, ChamadoTaskBody, RecordDto } from "@manutencao/shared";
import { api } from "../../../app/http";
import { invalidateRecords } from "../../registro/data/records";

export type OcorrenciaBody = {
  factoryId: string;
  line: string;
  body: string;
};

// Os chamados de um dia, na ordem em que foram abertos.
export function useChamadosOfDay(day: string) {
  return useQuery({
    queryKey: ["chamados", "day", day],
    queryFn: () => api<ChamadoDto[]>(`/api/turno/chamados?day=${day}`),
    placeholderData: keepPreviousData,
  });
}

// Os mais recentes de uma linha, para a tela da máquina.
export function useChamadosOfLine(lineId: string, limit: number) {
  return useQuery({
    queryKey: ["chamados", "line", lineId, limit],
    queryFn: () => api<ChamadoDto[]>(`/api/turno/chamados?lineId=${encodeURIComponent(lineId)}&limit=${limit}`),
  });
}

export function useChamado(id: string | null) {
  return useQuery({
    queryKey: ["chamados", "one", id],
    queryFn: () => api<ChamadoDto>(`/api/turno/chamados/${id}`),
    enabled: Boolean(id),
  });
}

function useChamadoSaved() {
  const client = useQueryClient();
  return (chamado: ChamadoDto) => {
    client.setQueryData(["chamados", "one", chamado.id], chamado);
    void client.invalidateQueries({ queryKey: ["chamados"], predicate: (query) => query.queryKey[1] !== "one" || query.queryKey[2] !== chamado.id });
  };
}

export function useSaveChamado(id?: string) {
  const saved = useChamadoSaved();
  return useMutation({
    mutationFn: (body: ChamadoBody) =>
      id
        ? api<ChamadoDto>(`/api/turno/chamados/${id}`, { method: "PATCH", body: JSON.stringify(body) })
        : api<ChamadoDto>("/api/turno/chamados", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: saved,
  });
}

// "Gerar pendência": a Tarefa nova entra em Pendências e no Dashboard.
export function useAddChamadoTask(id: string) {
  const client = useQueryClient();
  const saved = useChamadoSaved();
  return useMutation({
    mutationFn: (body: ChamadoTaskBody) =>
      api<ChamadoDto>(`/api/turno/chamados/${id}/tarefas`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (chamado) => {
      saved(chamado);
      invalidateRecords(client);
    },
  });
}

export function useSaveOcorrencia(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: OcorrenciaBody) =>
      api<RecordDto>(`/api/turno/ocorrencias/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: (record) => {
      client.setQueryData(["records", record.id], record);
      invalidateRecords(client, record.id);
    },
  });
}
