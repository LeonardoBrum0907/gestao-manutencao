import type { Cell, Row, Sheet } from "write-excel-file/browser";
import type { SheetCell, SheetRow, SheetTab, SheetTone } from "../model/team-sheet";

// Cores do tema claro do app (tokens.css): a planilha sai sempre em fundo branco.
const toneColors: Record<SheetTone, { backgroundColor: string; textColor: string } | null> = {
  qualified: { backgroundColor: "#E5F3EB", textColor: "#14502F" },
  near: { backgroundColor: "#FBF0DE", textColor: "#A35F00" },
  below: { backgroundColor: "#F8E8E6", textColor: "#8D2F2F" },
  unscored: { backgroundColor: "#EEF3F0", textColor: "#5E6E64" },
  group: { backgroundColor: "#DBE4DE", textColor: "#1C2822" },
  header: { backgroundColor: "#EEF3F0", textColor: "#1C2822" },
};

function toCell(cell: SheetCell): Cell {
  if (cell.value === null && !cell.tone) return null;
  const colors = cell.tone ? toneColors[cell.tone] : null;
  return {
    value: cell.value ?? undefined,
    type: typeof cell.value === "number" ? Number : String,
    format: cell.percent ? "0%" : undefined,
    fontWeight: cell.bold ? "bold" : undefined,
    columnSpan: cell.span && cell.span > 1 ? cell.span : undefined,
    align: cell.percent || cell.tone === "header" ? "center" : undefined,
    wrap: cell.tone === "header" ? true : undefined,
    ...(colors ?? {}),
  };
}

// A biblioteca exige uma célula vazia (null) para cada coluna que a mesclagem cobre.
function toRow(row: SheetRow): Row {
  return row.flatMap((cell) => [toCell(cell), ...Array.from({ length: Math.max(0, (cell.span ?? 1) - 1) }, () => null)]);
}

function toSheet(tab: SheetTab): Sheet<Blob> {
  return {
    sheet: tab.name,
    data: tab.rows.map(toRow),
    columns: tab.widths.map((width) => ({ width })),
    stickyRowsCount: tab.frozenRows,
    stickyColumnsCount: tab.frozenColumns,
  };
}

/**
 * Baixa a planilha da Matriz da equipe. A biblioteca só carrega quando alguém exporta, para não pesar a tela.
 * @example await downloadTeamWorkbook([teamMatrixTab(team, grid, view, hoje), teamTrainingTab(team)], "matriz-da-equipe-2026-10-12.xlsx")
 */
export async function downloadTeamWorkbook(tabs: SheetTab[], fileName: string): Promise<void> {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  await writeXlsxFile(tabs.map(toSheet)).toFile(fileName);
}
