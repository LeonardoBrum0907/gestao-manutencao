import type { PublicRpDirectoryDto, PublicRpDto } from "@manutencao/shared";
import { dayOf } from "../../rp/model/rp";

// Planilha que o supervisor exporta dos RPs aprovados, no modelo "Gerenciamento ações" do Léo (2026-10-19):
// mesmas colunas e na mesma ordem, para colar direto na tabela de ações. Cada contramedida preventiva vira uma
// linha (uma ação), repetindo o resto do RP, como na aba de exemplo do modelo. A coluna __PowerAppsId__ do modelo
// fica de fora: é o próprio PowerApps que preenche.

/** Célula de data (AAAA-MM-DD): vira data de verdade no Excel, não texto. */
export type RpExportDay = { day: string };
export type RpExportCell = string | RpExportDay;

/** Tabela pronta para virar planilha: cabeçalho, larguras (em caracteres) e as linhas. */
export type RpExportTable = { headers: string[]; widths: number[]; rows: RpExportCell[][] };

// Ação nova entra assim na planilha; quem acompanha muda depois.
const NEW_ACTION_STATUS = "Em Andamento";
const ACTION_ORIGIN = "FSP";

type ExportContext = { directory: PublicRpDirectoryDto; responsible: string; preventive: string };
type ExportColumn = { header: string; width: number; value: (rp: PublicRpDto, context: ExportContext) => RpExportCell };

function lineName(rp: PublicRpDto, { directory }: ExportContext): string {
  const registered = rp.lineId ? directory.lines.find((line) => line.id === rp.lineId)?.name : undefined;
  return registered ?? rp.line ?? "";
}

function machineTag(rp: PublicRpDto, { directory }: ExportContext): string {
  return rp.tag ?? directory.machines.find((machine) => machine.id === rp.machineId)?.tag ?? "";
}

const RP_EXPORT_COLUMNS: ExportColumn[] = [
  // O número da ação (EMB3/25…) é dado pelo sistema de ações.
  { header: "N° Ação", width: 12, value: () => "" },
  { header: "Problema", width: 50, value: (rp) => rp.problem },
  { header: "Causa raiz", width: 44, value: (rp) => rp.rootCause ?? "" },
  { header: "Contra medida Corretiva", width: 60, value: (rp) => rp.corrective ?? "" },
  { header: "Contra medida Preventiva", width: 50, value: (_rp, context) => context.preventive },
  { header: "Responsável", width: 19, value: (_rp, context) => context.responsible },
  { header: "Prazo", width: 14, value: () => "" },
  { header: "Status", width: 16, value: () => NEW_ACTION_STATUS },
  { header: "Origem da Ação", width: 16, value: () => ACTION_ORIGIN },
  { header: "ÁREA", width: 21, value: (rp, { directory }) => directory.factories.find((item) => item.id === rp.factoryId)?.name ?? "" },
  { header: "TAG", width: 17, value: machineTag },
  { header: "Linha", width: 17, value: lineName },
  { header: "Executante", width: 24, value: (rp) => rp.memberNames.join(", ") },
  { header: "Data da ocorrencia", width: 16, value: (rp) => ({ day: dayOf(rp.occurredAt) }) },
  // A ordem do RP é controle interno (pedido do Léo, 2026-10-19): fica fora da planilha, e Observações sai em branco.
  { header: "Observações", width: 36, value: () => "" },
];

// "- item", "• item", "* item", "1. item", "2) item". O WhatsApp às vezes cola um caractere invisível (U+2060)
// junto do marcador: sai antes de procurar a lista.
const BULLET = /^(?:[-•*·–]\s*|\d+[.)]\s+)/;

/**
 * As ações da contramedida preventiva: uma por item de lista; texto sem lista é uma ação só.
 * Linha sem marcador continua o item de cima.
 * @example preventiveActions("- Revisar plano\n- Treinar operador") // ["Revisar plano", "Treinar operador"]
 */
export function preventiveActions(text: string | null): string[] {
  const lines = (text ?? "").replace(/\u2060/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.filter((line) => BULLET.test(line)).length < 2) return [lines.join("\n").replace(BULLET, "")];
  const actions: string[] = [];
  for (const line of lines) {
    if (BULLET.test(line) || !actions.length) actions.push(line.replace(BULLET, ""));
    else actions[actions.length - 1] += `\n${line}`;
  }
  return actions;
}

function rpRows(rp: PublicRpDto, directory: PublicRpDirectoryDto, responsible: string): RpExportCell[][] {
  return preventiveActions(rp.preventive).map((preventive) =>
    RP_EXPORT_COLUMNS.map((column) => column.value(rp, { directory, responsible, preventive })),
  );
}

/**
 * Monta a planilha de ações com os RPs escolhidos, do mais antigo para o mais novo.
 * `responsible` é o supervisor que exporta (vai na coluna Responsável).
 * @example rpExportTable(rps, directory, "Anderson").rows[0] // ["", "Alarme na esteira.", …]
 */
export function rpExportTable(rps: PublicRpDto[], directory: PublicRpDirectoryDto, responsible: string): RpExportTable {
  const ordered = [...rps].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  return {
    headers: RP_EXPORT_COLUMNS.map((column) => column.header),
    widths: RP_EXPORT_COLUMNS.map((column) => column.width),
    rows: ordered.flatMap((rp) => rpRows(rp, directory, responsible)),
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
