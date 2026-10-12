import type { DashboardFlowWeekDto } from "@manutencao/shared";
import { countByWeek } from "./period";

export const FLOW_WEEKS = 8;

/**
 * Tarefas e problemas que entraram e que foram concluídos em cada semana.
 * @example flowByWeek([segunda], [], ["2026-10-12"]) // [{ weekStart: "2026-10-12", created: 1, completed: 0 }]
 */
export function flowByWeek(created: readonly Date[], completed: readonly Date[], weeks: readonly string[]): DashboardFlowWeekDto[] {
  const entered = countByWeek(created, weeks);
  const done = countByWeek(completed, weeks);
  return weeks.map((weekStart) => ({ weekStart, created: entered.get(weekStart) ?? 0, completed: done.get(weekStart) ?? 0 }));
}
