import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TaskReminderBody, TaskReminderDto } from "@manutencao/shared";
import { api } from "../../../app/http";

const remindersKey = (recordId: string) => ["reminders", recordId];

/** Lembretes da tarefa, na ordem em que foram criados. */
export function useTaskReminders(recordId: string) {
  return useQuery({ queryKey: remindersKey(recordId), queryFn: () => api<TaskReminderDto[]>(`/api/records/${recordId}/reminders`) });
}

export function useAddReminder(recordId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: TaskReminderBody) => api<TaskReminderDto>(`/api/records/${recordId}/reminders`, { method: "POST", body: JSON.stringify(body) }),
    onSettled: () => client.invalidateQueries({ queryKey: remindersKey(recordId) }),
  });
}

export function useRemoveReminder(recordId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/reminders/${id}`, { method: "DELETE" }),
    onSettled: () => client.invalidateQueries({ queryKey: remindersKey(recordId) }),
  });
}
