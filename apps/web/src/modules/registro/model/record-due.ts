import type { RecordListItemDto } from "@manutencao/shared";
import { dueDay, dueLabel } from "./board";
import { dueClockOf } from "./due-time";

/** O prazo como aparece em Registros: o texto ("Hoje", "Amanhã", "10 out 14:30") e se está atrasado. */
export type RecordDue = { text: string; late: boolean };

/**
 * Prazo do registro em relação a hoje; null quando não tem prazo. Concluído nunca conta como atrasado.
 * @example recordDue({ dueAt: "2026-10-10T15:00:00.000Z", dueHasTime: false, status: "open" }, "2026-10-15") // → { text: "10 out", late: true }
 */
export function recordDue(row: Pick<RecordListItemDto, "dueAt" | "dueHasTime" | "status">, today: string): RecordDue | null {
  if (!row.dueAt) return null;
  const time = row.dueHasTime ? ` ${dueClockOf(row.dueAt)}` : "";
  return { text: `${dueLabel(row.dueAt, today)}${time}`, late: row.status !== "done" && dueDay(row.dueAt) < today };
}
