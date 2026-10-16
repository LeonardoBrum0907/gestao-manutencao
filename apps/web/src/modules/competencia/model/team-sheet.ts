import { TEAM_MATRIX_VIEW_LABELS, type TeamMatrixDto, type TeamMatrixView } from "@manutencao/shared";
import { coverageLabel } from "./team";
import type { TeamColumn } from "./team-columns";
import type { TeamGrid } from "./team-grid";
import { cellTone, trainingNeeds, type CellTone } from "./team-insights";
import { blockQualified, cellOf, qualifiedCount, shiftLabel } from "./team-rows";

// Planilha descrita sem depender da biblioteca que grava o .xlsx: o adaptador em data/ traduz para ela.
// Célula com span ocupa span colunas: a fileira não traz nada para as colunas que ela cobre.
export type SheetTone = CellTone | "group" | "header";
export type SheetCell = { value: string | number | null; bold?: boolean; tone?: SheetTone; span?: number; percent?: boolean };
export type SheetRow = SheetCell[];
export type SheetTab = { name: string; rows: SheetRow[]; widths: number[]; frozenRows: number; frozenColumns: number };

const header = (value: string, span = 1): SheetCell => ({ value, bold: true, tone: "header", span });

function columnTitle(column: TeamColumn): string {
  return column.detail ? `${column.label} (${column.detail})` : column.label;
}

function headerRows(team: TeamMatrixDto, grid: TeamGrid): SheetRow[] {
  const coverage = new Map(team.equipments.map((equipment) => [equipment.id, equipment]));
  const blocks = grid.columnBlocks.some((block) => block.label)
    ? [[header(""), ...grid.columnBlocks.map((block) => header(block.label ?? "", block.columns.length)), header("")]]
    : [];
  const titles = [header("Técnico"), ...grid.columns.map((column) => header(columnTitle(column))), header("Qualificado em")];
  const minimum = [
    header("Qualificados / mínimo"),
    ...grid.columns.map((column) => {
      const equipment = coverage.get(column.equipmentId);
      return header(equipment ? `${equipment.qualified} / ${equipment.minQualified} · ${coverageLabel[equipment.status]}` : "");
    }),
    header(""),
  ];
  return [...blocks, titles, minimum];
}

function memberRows(team: TeamMatrixDto, grid: TeamGrid, view: TeamMatrixView): SheetRow[] {
  const cut = team.qualifiedAdherence;
  const width = grid.columns.length + 2;
  return grid.rowBlocks.flatMap((block) => {
    const title: SheetRow[] = block.label ? [[{ value: `${block.label} · ${block.members.length}`, bold: true, tone: "group", span: width }]] : [];
    const rows = block.members.map((member): SheetRow => [
      { value: member.name, bold: true },
      ...grid.columns.map((column): SheetCell => {
        const cell = cellOf(member, column.equipmentId);
        if (!cell) return { value: null };
        return { value: cell.adherence === null ? null : cell.adherence / 100, percent: true, tone: cellTone(cell.adherence, cell.scored, cut, view) };
      }),
      { value: `${qualifiedCount(member, cut)} de ${team.equipments.length}` },
    ]);
    const subtotal: SheetRow[] = block.label
      ? [[{ value: `Qualificados · ${block.label}`, bold: true }, ...grid.columns.map((column) => ({ value: blockQualified(block.members, column.equipmentId, cut), bold: true })), { value: null }]]
      : [];
    return [...title, ...rows, ...subtotal];
  });
}

/**
 * Quantos técnicos a grade mostra, no singular ou no plural, para o subtítulo da folha A4 e da planilha.
 * @example technicianCountLabel(1) // "1 técnico"
 */
export function technicianCountLabel(count: number): string {
  return count === 1 ? "1 técnico" : `${count} técnicos`;
}

/**
 * Aba "Matriz": a grade como está na tela (mesma ordem, grupos e filtros), com a nota em % e a cor do tom.
 * @example teamMatrixTab(team, grid, "training").rows[0] // título com a data
 */
export function teamMatrixTab(team: TeamMatrixDto, grid: TeamGrid, view: TeamMatrixView, today: string): SheetTab {
  const intro: SheetRow[] = [
    [{ value: `Matriz da equipe · ${today}`, bold: true }],
    [{ value: `Qualificado: aderência de ${team.qualifiedAdherence}% ou mais · Visão: ${TEAM_MATRIX_VIEW_LABELS[view]} · ${technicianCountLabel(grid.memberCount)}` }],
    [],
  ];
  const head = headerRows(team, grid);
  return {
    name: "Matriz",
    rows: [...intro, ...head, ...memberRows(team, grid, view)],
    widths: [26, ...grid.columns.map(() => 16), 14],
    frozenRows: intro.length + head.length,
    frozenColumns: 1,
  };
}

/**
 * Aba "Quem treinar": equipamentos em risco e os técnicos mais perto do corte.
 * @example teamTrainingTab(team).rows[1] // ["Encaixotadora Mediseal", "Ninguém qualificado", 0, 2, "Renata", 0.78, 2, "3º turno"]
 */
export function teamTrainingTab(team: TeamMatrixDto): SheetTab {
  const titles = ["Equipamento", "Situação", "Qualificados", "Mínimo", "Técnico", "Aderência", "Falta (pts)", "Turno"].map((title) => header(title));
  const rows = trainingNeeds(team, 5).flatMap((need) =>
    (need.candidates.length ? need.candidates : [null]).map((candidate): SheetRow => [
      { value: need.name, bold: true },
      { value: coverageLabel[need.status] },
      { value: need.qualified },
      { value: need.minQualified },
      { value: candidate?.name ?? "Ninguém com o equipamento na matriz" },
      { value: candidate ? candidate.adherence / 100 : null, percent: true },
      { value: candidate?.gap ?? null },
      { value: candidate ? shiftLabel(candidate.shift) : null },
    ]),
  );
  return { name: "Quem treinar", rows: [titles, ...rows], widths: [28, 20, 12, 10, 26, 12, 12, 16], frozenRows: 1, frozenColumns: 0 };
}
