import { defaultTaskReminders, type RecordPriority, type RecordType, type TaskReminderBody } from "@manutencao/shared";

/**
 * Lembretes que a tarefa ganha ao virar prioridade alta (decisão N dos avisos: "1 h antes"). Só quando
 * ela ainda não tem lembrete: quem já escolheu os seus não ganha outro.
 * @example priorityReminders(null, { type: "task", priority: "high" }, 0) // [{ kind: "before", minutesBefore: 60 }]
 */
export function priorityReminders(
  before: RecordPriority | null,
  after: { type: RecordType; priority: RecordPriority | null },
  existing: number,
): TaskReminderBody[] {
  if (after.type !== "task" || before === after.priority || existing > 0) return [];
  return defaultTaskReminders(after.priority);
}
