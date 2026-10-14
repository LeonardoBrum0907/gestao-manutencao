import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { BoardChangeDto, BoardDto, FeedbackTone, RecordDto, RecordPriority } from "@manutencao/shared";
import { api } from "../../../app/http";
import { dueAtOf } from "../model/board";
import type { ProblemSheetBody, TaskSheetBody } from "./records";

// Os checklists de Registros vêm inteiros (abertos + concluídos recentes): são dezenas, não milhares.
export function useTaskBoard() {
  return useQuery({ queryKey: ["records", "board", "tasks"], queryFn: () => api<BoardDto>("/api/records/board/tasks") });
}

export function changeOnBoard(id: string, change: BoardChangeDto) {
  return api<{ ok: true }>(`/api/records/${id}/board`, { method: "PATCH", body: JSON.stringify(change) });
}

// Espera as listas voltarem do servidor: quem chamou só tira o efeito de "sumindo" depois disso.
export function refreshRecords(client: QueryClient) {
  return Promise.all([
    client.invalidateQueries({ queryKey: ["records"] }),
    client.invalidateQueries({ queryKey: ["dashboard"] }),
    client.invalidateQueries({ queryKey: ["chamados"] }),
  ]);
}

export function useBoardChange() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, change }: { id: string; change: BoardChangeDto }) => changeOnBoard(id, change),
    onSettled: () => refreshRecords(client),
  });
}

function capture(input: { type: "task" | "problem" | "feedback"; body: string; memberId?: string | null; tone?: FeedbackTone | null }) {
  return api<RecordDto>("/api/records", {
    method: "POST",
    body: JSON.stringify({ memberId: null, ...input, occurredAt: new Date().toISOString() }),
  });
}

export type NewTask = { body: string; day: string | null; priority: RecordPriority | null };

// Tarefa nova já com o prazo e a prioridade do cartão de adicionar (o prazo vem do grupo, se não mudou).
export function useAddTask() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, day, priority }: NewTask) => {
      const record = await capture({ type: "task", body });
      if (!day && !priority) return record;
      const sheet: TaskSheetBody = {
        body: record.body,
        occurredAt: record.occurredAt,
        status: "open",
        memberId: null,
        factoryId: null,
        tag: null,
        line: null,
        priority,
        dueAt: day ? dueAtOf(day) : null,
        notes: null,
      };
      return api<RecordDto>(`/api/records/${record.id}`, { method: "PATCH", body: JSON.stringify(sheet) });
    },
    onSettled: () => refreshRecords(client),
  });
}

export type NewProblemSpot = { lineId: string | null; machineId?: string | null; subassemblyId?: string | null };

// Problema novo já no lugar do grupo (linha, máquina, subconjunto) e, em "Em andamento", já em andamento.
export function useAddProblem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, spot, inProgress }: { body: string; spot: NewProblemSpot; inProgress: boolean }) => {
      const record = await capture({ type: "problem", body });
      const { lineId, machineId = null, subassemblyId = null } = spot;
      if (lineId) {
        const sheet: ProblemSheetBody = { body: record.body, occurredAt: record.occurredAt, memberId: null, lineId, lineLabel: null, machineId, subassemblyId, notes: null };
        await api<RecordDto>(`/api/records/${record.id}`, { method: "PATCH", body: JSON.stringify(sheet) });
      }
      if (inProgress) await changeOnBoard(record.id, { status: "in_progress" });
      return record;
    },
    onSettled: () => refreshRecords(client),
  });
}

export function useAddFeedback() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ body, memberId, tone }: { body: string; memberId: string | null; tone: FeedbackTone | null }) =>
      capture({ type: "feedback", body, memberId, tone }),
    onSettled: () => refreshRecords(client),
  });
}
