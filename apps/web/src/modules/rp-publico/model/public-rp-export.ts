import { RP_FOUR_M_LABELS, type PublicRpDirectoryDto, type PublicRpDto, type RpFourM } from "@manutencao/shared";
import { formatRpDay, rpStatusLabel } from "../../rp/model/rp";

// Planilha que o supervisor exporta dos RPs aprovados. Colunas PROVISÓRIAS: o Léo vai mandar o modelo do outro
// sistema (2026-10-18) e aí esta lista muda para a ordem e os nomes de lá. Uma coluna por campo do RP.

/** Tabela pronta para virar planilha: cabeçalho, larguras (em caracteres) e uma linha de texto por RP. */
export type RpExportTable = { headers: string[]; widths: number[]; rows: string[][] };

type ExportContext = { directory: PublicRpDirectoryDto };
type ExportColumn = { header: string; width: number; value: (rp: PublicRpDto, context: ExportContext) => string };

function causeColumn(key: RpFourM): ExportColumn {
  return {
    header: `4M: ${RP_FOUR_M_LABELS[key]}`,
    width: 22,
    value: (rp) => (rp.causes[key].marked ? rp.causes[key].text || "X" : ""),
  };
}

function lineName(rp: PublicRpDto, { directory }: ExportContext): string {
  const registered = rp.lineId ? directory.lines.find((line) => line.id === rp.lineId)?.name : undefined;
  return registered ?? rp.line ?? "";
}

const RP_EXPORT_COLUMNS: ExportColumn[] = [
  { header: "Data", width: 12, value: (rp) => formatRpDay(rp.occurredAt) },
  { header: "Fábrica", width: 18, value: (rp, { directory }) => directory.factories.find((item) => item.id === rp.factoryId)?.name ?? "" },
  { header: "Linha", width: 18, value: lineName },
  { header: "Máquina", width: 22, value: (rp, { directory }) => directory.machines.find((item) => item.id === rp.machineId)?.name ?? "" },
  { header: "TAG", width: 14, value: (rp) => rp.tag ?? "" },
  { header: "Ordem", width: 12, value: (rp) => rp.orderNumber ?? "" },
  { header: "Problema", width: 40, value: (rp) => rp.problem },
  { header: "Descrição", width: 40, value: (rp) => rp.description ?? "" },
  { header: "Falha repetida", width: 14, value: (rp) => (rp.repeatedFailure ? "Sim" : "Não") },
  { header: "Quantas vezes", width: 14, value: (rp) => (rp.repeatedFailure ? rp.repeatedTimes ?? "" : "") },
  { header: "Período", width: 16, value: (rp) => (rp.repeatedFailure ? rp.repeatedPeriod ?? "" : "") },
  causeColumn("material"),
  causeColumn("machine"),
  causeColumn("method"),
  causeColumn("labor"),
  { header: "Causa raiz", width: 40, value: (rp) => rp.rootCause ?? "" },
  { header: "Contramedida corretiva", width: 40, value: (rp) => rp.corrective ?? "" },
  { header: "Contramedida preventiva", width: 40, value: (rp) => rp.preventive ?? "" },
  { header: "Status", width: 18, value: (rp) => rpStatusLabel(rp.status) },
  { header: "Técnicos", width: 24, value: (rp) => rp.memberNames.join(", ") },
  { header: "Impacto em condição básica", width: 30, value: (rp) => rp.basicConditionImpact ?? "" },
];

/**
 * Monta a tabela da planilha com os RPs escolhidos, do mais antigo para o mais novo.
 * @example rpExportTable(rps, directory).rows[0] // ["04/10/2026", "Fábrica 1", "Cam 08", …]
 */
export function rpExportTable(rps: PublicRpDto[], directory: PublicRpDirectoryDto): RpExportTable {
  const ordered = [...rps].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  return {
    headers: RP_EXPORT_COLUMNS.map((column) => column.header),
    widths: RP_EXPORT_COLUMNS.map((column) => column.width),
    rows: ordered.map((rp) => RP_EXPORT_COLUMNS.map((column) => column.value(rp, { directory }))),
  };
}

/**
 * Nome do arquivo baixado, com o dia de hoje.
 * @example rpExportFileName("2026-10-18") // "rps-aprovados-2026-10-18.xlsx"
 */
export function rpExportFileName(today: string): string {
  return `rps-aprovados-${today}.xlsx`;
}

/**
 * Liga ou desliga um RP na seleção, sem mexer no conjunto de antes (o React compara por referência).
 * @example toggleSelected(new Set(["a"]), "b") // Set { "a", "b" }
 */
export function toggleSelected(selected: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/**
 * Seleção enquanto o dedo arrasta depois de segurar, como na galeria do celular: o que já estava marcado continua,
 * mais todos os RPs entre o que foi segurado e o que está debaixo do dedo agora (para cima ou para baixo).
 * @example dragSelection(new Set(), ["a", "b", "c", "d"], "b", "d") // Set { "b", "c", "d" }
 */
export function dragSelection(base: ReadonlySet<string>, ids: readonly string[], anchorId: string, currentId: string): Set<string> {
  const from = ids.indexOf(anchorId);
  const to = ids.indexOf(currentId);
  const next = new Set(base);
  if (from < 0 || to < 0) return next.add(anchorId);
  for (const id of ids.slice(Math.min(from, to), Math.max(from, to) + 1)) next.add(id);
  return next;
}
