import type { ChamadoDto, RecordStatus } from "@manutencao/shared";
import { chamadoStatusChoices } from "./chamado";

// Plural de cada status na linha de resumo ("2 liberados"); "em andamento" não varia.
const STATUS_PLURALS: Record<RecordStatus, string> = { done: "liberados", open: "pendentes", in_progress: "em andamento" };

function statusCount(status: RecordStatus, label: string, count: number): string {
  return `${count} ${count === 1 ? label.toLowerCase() : STATUS_PLURALS[status]}`;
}

/**
 * Linha de resumo do dia ao lado do título: total e a contagem de cada status presente, na ordem do turno.
 * @example chamadosDaySummary([{ status: "done" }, { status: "open" }]) // "2 chamados · 1 liberado · 1 pendente"
 */
export function chamadosDaySummary(items: Pick<ChamadoDto, "status">[]): string {
  if (!items.length) return "";
  const parts = chamadoStatusChoices
    .map((choice) => ({ ...choice, count: items.filter((item) => item.status === choice.value).length }))
    .filter((part) => part.count > 0)
    .map((part) => statusCount(part.value, part.label, part.count));
  return `${items.length} ${items.length === 1 ? "chamado" : "chamados"} · ${parts.join(" · ")}`;
}
