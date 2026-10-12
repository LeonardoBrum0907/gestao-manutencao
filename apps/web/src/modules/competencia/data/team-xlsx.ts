import type { Cell, Row, Sheet } from "write-excel-file/browser";
import { domLightTokenReader, lightColors, type TokenReader } from "../../../design/light-tokens";
import type { SheetCell, SheetRow, SheetTab, SheetTone } from "../model/team-sheet";

// Tokens de tokens.css por tom: a planilha sai sempre no tema claro, com as mesmas cores da tela.
const toneTokens: Record<SheetTone, { backgroundColor: string; textColor: string }> = {
  qualified: { backgroundColor: "--accent-soft", textColor: "--accent-ink" },
  near: { backgroundColor: "--warn-soft", textColor: "--warn" },
  below: { backgroundColor: "--danger-soft", textColor: "--danger" },
  unscored: { backgroundColor: "--chip-bg", textColor: "--muted" },
  group: { backgroundColor: "--group-bg", textColor: "--text" },
  header: { backgroundColor: "--chip-bg", textColor: "--text" },
};

type ToneColors = Record<SheetTone, { backgroundColor: string; textColor: string }>;

function toneColorsFrom(read: TokenReader): ToneColors {
  const tones = Object.keys(toneTokens) as SheetTone[];
  return Object.fromEntries(tones.map((tone) => [tone, lightColors(toneTokens[tone], read)])) as ToneColors;
}

function toCell(cell: SheetCell, toneColors: ToneColors): Cell {
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
function toRow(row: SheetRow, toneColors: ToneColors): Row {
  return row.flatMap((cell) => [toCell(cell, toneColors), ...Array.from({ length: Math.max(0, (cell.span ?? 1) - 1) }, () => null)]);
}

function toSheet(tab: SheetTab, toneColors: ToneColors): Sheet<Blob> {
  return {
    sheet: tab.name,
    data: tab.rows.map((row) => toRow(row, toneColors)),
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
  const toneColors = toneColorsFrom(domLightTokenReader());
  await writeXlsxFile(tabs.map((tab) => toSheet(tab, toneColors))).toFile(fileName);
}
