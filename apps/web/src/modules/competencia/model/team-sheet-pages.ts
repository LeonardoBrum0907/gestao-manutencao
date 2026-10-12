import type { TeamColumnBlock } from "./team-columns";

/**
 * Quantas colunas de equipamento cabem numa folha A4 deitada com o nome do técnico e "Qualif." ao lado.
 * Com mais que isso a grade passava da margem e o PDF cortava as últimas linhas de produção.
 */
export const SHEET_COLUMNS_PER_PAGE = 18;

function splitBlock(block: TeamColumnBlock, size: number): TeamColumnBlock[] {
  const pieces: TeamColumnBlock[] = [];
  for (let start = 0; start < block.columns.length; start += size) {
    pieces.push({ ...block, columns: block.columns.slice(start, start + size) });
  }
  return pieces;
}

/**
 * Reparte os blocos de colunas em folhas, sem quebrar uma linha de produção entre duas folhas quando ela cabe inteira.
 * Só um bloco maior que uma folha é cortado.
 * @example sheetColumnPages(grid.columnBlocks, 18) // [[MED 03, CAM 01, ...], [MED 05, ...]]
 */
export function sheetColumnPages(blocks: readonly TeamColumnBlock[], perPage: number = SHEET_COLUMNS_PER_PAGE): TeamColumnBlock[][] {
  const pages: TeamColumnBlock[][] = [];
  let current: TeamColumnBlock[] = [];
  let used = 0;
  for (const piece of blocks.flatMap((block) => splitBlock(block, perPage))) {
    if (used + piece.columns.length > perPage && current.length) {
      pages.push(current);
      current = [];
      used = 0;
    }
    current.push(piece);
    used += piece.columns.length;
  }
  return current.length ? [...pages, current] : pages;
}
