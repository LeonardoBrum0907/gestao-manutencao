import type { ChamadoDto } from "@manutencao/shared";
import { chamadoStatusChoices } from "./chamado";

/**
 * Linha de resumo do dia ao lado do título: total e a contagem de cada status presente, na ordem do turno.
 * @example chamadosDaySummary([{ status: "done" }, { status: "open" }]) // "2 chamados · 1 liberado · 1 pendente"
 */
export function chamadosDaySummary(items: Pick<ChamadoDto, "status">[]): string {
  if (!items.length) return "";
  const parts = chamadoStatusChoices
    .map((choice) => ({ label: choice.label.toLowerCase(), count: items.filter((item) => item.status === choice.value).length }))
    .filter((part) => part.count > 0)
    .map((part) => `${part.count} ${part.label}`);
  return `${items.length} ${items.length === 1 ? "chamado" : "chamados"} · ${parts.join(" · ")}`;
}
