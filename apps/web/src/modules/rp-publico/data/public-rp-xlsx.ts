import type { Cell, Row } from "write-excel-file/browser";
import type { RpExportCell, RpExportTable } from "../model/public-rp-export";

function headerRow(table: RpExportTable): Row {
  return table.headers.map((header) => ({ value: header, type: String, fontWeight: "bold", wrap: true }));
}

// A biblioteca conta a data em UTC: meia-noite UTC do dia é o próprio dia no Excel, sem hora.
function bodyCell(value: RpExportCell): Cell {
  if (typeof value !== "string") return { value: new Date(`${value.day}T00:00:00Z`), type: Date, format: "dd/mm/yyyy" };
  return value ? { value, type: String, wrap: true } : null;
}

/**
 * Baixa a planilha dos RPs aprovados. A biblioteca só carrega quando alguém exporta, para não pesar a página.
 * @example await downloadRpExport(rpExportTable(rps, directory, "Anderson"), "rps-aprovados-2026-10-18.xlsx")
 */
export async function downloadRpExport(table: RpExportTable, fileName: string): Promise<void> {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const sheet = {
    sheet: "Ações",
    data: [headerRow(table), ...table.rows.map((row) => row.map(bodyCell))],
    columns: table.widths.map((width) => ({ width })),
    stickyRowsCount: 1,
  };
  await writeXlsxFile([sheet]).toFile(fileName);
}
