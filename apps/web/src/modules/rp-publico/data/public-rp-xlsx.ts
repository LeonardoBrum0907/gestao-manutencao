import type { Row } from "write-excel-file/browser";
import type { RpExportTable } from "../model/public-rp-export";

function headerRow(table: RpExportTable): Row {
  return table.headers.map((header) => ({ value: header, type: String, fontWeight: "bold", wrap: true }));
}

function bodyRow(values: string[]): Row {
  return values.map((value) => (value ? { value, type: String, wrap: true } : null));
}

/**
 * Baixa a planilha dos RPs aprovados. A biblioteca só carrega quando alguém exporta, para não pesar a página.
 * @example await downloadRpExport(rpExportTable(rps, directory), "rps-aprovados-2026-10-18.xlsx")
 */
export async function downloadRpExport(table: RpExportTable, fileName: string): Promise<void> {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const sheet = {
    sheet: "RPs",
    data: [headerRow(table), ...table.rows.map(bodyRow)],
    columns: table.widths.map((width) => ({ width })),
    stickyRowsCount: 1,
  };
  await writeXlsxFile([sheet]).toFile(fileName);
}
