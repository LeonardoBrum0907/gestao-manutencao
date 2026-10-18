import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { samplePublicRp, sampleDirectory } from "./fake-public-rp";
import { rpExportFileName, rpExportTable, toggleSelected } from "./public-rp-export";

function cell(table: ReturnType<typeof rpExportTable>, row: number, header: string): string {
  return table.rows[row]![table.headers.indexOf(header)]!;
}

describe("rpExportTable", () => {
  it("uma linha por RP, do mais antigo para o mais novo, com uma coluna por campo", () => {
    const table = rpExportTable([samplePublicRp({ id: "b", occurredAt: "2026-10-10T12:00:00.000Z" }), samplePublicRp({ id: "a" })], sampleDirectory);
    assert.equal(table.headers.length, table.widths.length);
    assert.equal(table.rows.length, 2);
    assert.deepEqual([cell(table, 0, "Data"), cell(table, 1, "Data")], ["04/10/2026", "10/10/2026"]);
    table.rows.forEach((row) => assert.equal(row.length, table.headers.length));
  });

  it("troca ids pelos nomes do cadastro e escreve o status por extenso", () => {
    const table = rpExportTable([samplePublicRp({ machineId: "mq1", status: "corrected" })], sampleDirectory);
    assert.deepEqual([cell(table, 0, "Fábrica"), cell(table, 0, "Linha"), cell(table, 0, "Máquina")], ["Fábrica 1", "Cam 08", "Blistadeira"]);
    assert.equal(cell(table, 0, "Status"), "Corrigido");
    assert.equal(cell(table, 0, "Técnicos"), "Rogério B");
  });

  it("4M marcado sai com o detalhe, ou X sem detalhe; falha repetida só com Sim", () => {
    const causes = { ...samplePublicRp().causes, machine: { marked: true, text: "Ferramental" }, method: { marked: true, text: null } };
    const table = rpExportTable([samplePublicRp({ causes, repeatedFailure: false, repeatedTimes: "3" })], sampleDirectory);
    assert.deepEqual([cell(table, 0, "4M: Máquina"), cell(table, 0, "4M: Método"), cell(table, 0, "4M: Material")], ["Ferramental", "X", ""]);
    assert.deepEqual([cell(table, 0, "Falha repetida"), cell(table, 0, "Quantas vezes")], ["Não", ""]);
  });
});

describe("rpExportFileName e toggleSelected", () => {
  it("nome do arquivo com o dia", () => {
    assert.equal(rpExportFileName("2026-10-18"), "rps-aprovados-2026-10-18.xlsx");
  });

  it("liga e desliga sem mexer no conjunto de antes", () => {
    const before = new Set(["a"]);
    assert.deepEqual([...toggleSelected(before, "b")], ["a", "b"]);
    assert.deepEqual([...toggleSelected(before, "a")], []);
    assert.deepEqual([...before], ["a"]);
  });
});
