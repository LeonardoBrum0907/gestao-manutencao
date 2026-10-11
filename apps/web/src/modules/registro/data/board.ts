import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BoardChangeDto, BoardDto, RecordDto } from "@manutencao/shared";
import { api } from "../../../app/http";
import { invalidateRecords } from "./records";

const boardKey = ["records", "board"] as const;

// O checklist de Tarefas vem inteiro (abertas + concluídas da semana): são dezenas, não milhares.
export function useTaskBoard() {
  return useQuery({
    queryKey: boardKey,
    queryFn: () => api<BoardDto>("/api/records/board"),
  });
}

export function changeOnBoard(id: string, change: BoardChangeDto) {
  return api<{ ok: true }>(`/api/records/${id}/board`, { method: "PATCH", body: JSON.stringify(change) });
}

export function useBoardChange() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, change }: { id: string; change: BoardChangeDto }) => changeOnBoard(id, change),
    // Marcar o círculo já risca e tira a tarefa da lista; se a gravação falhar, a lista volta do servidor.
    onMutate: async ({ id, change }) => {
      if (!change.status) return;
      await client.cancelQueries({ queryKey: boardKey });
      client.setQueryData<BoardDto>(boardKey, (board) =>
        board
          ? {
              ...board,
              items: board.items.map((item) =>
                item.id === id ? { ...item, status: change.status ?? item.status, group: change.status === "done" ? "done" : item.group } : item,
              ),
            }
          : board,
      );
    },
    onSettled: () => invalidateRecords(client),
  });
}

// Adicionar no rodapé de um grupo: cria a tarefa e, fora de "Sem prazo", já leva para o grupo.
export function useAddTask() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, group }: { body: string; group: NonNullable<BoardChangeDto["group"]> }) => {
      const record = await api<RecordDto>("/api/records", {
        method: "POST",
        body: JSON.stringify({ type: "task", body, occurredAt: new Date().toISOString(), memberId: null }),
      });
      if (group !== "undated") await changeOnBoard(record.id, { group });
      return record;
    },
    onSettled: () => invalidateRecords(client),
  });
}
