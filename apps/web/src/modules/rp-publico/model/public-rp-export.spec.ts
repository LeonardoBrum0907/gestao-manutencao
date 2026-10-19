import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { samplePublicRp, sampleDirectory } from "./fake-public-rp";
import { dragSelection, preventiveActions, rpExportFileName, rpExportTable, toggleSelected, type RpExportCell } from "./public-rp-export";

function cell(table: ReturnType<typeof rpExportTable>, row: number, header: string): RpExportCell {
  return table.rows[row]![table.headers.indexOf(header)]!;
}

describe("rpExportTable", () => {
  it("colunas do modelo Gerenciamento ações, na mesma ordem", () => {
    const table = rpExportTable([samplePublicRp()], sampleDirectory, "Anderson");
    assert.deepEqual(table.headers, [
      "N° Ação", "Problema", "Causa raiz", "Contra medida Corretiva", "Contra medida Preventiva", "Responsável", "Prazo", "Status",
      "Origem da Ação", "ÁREA", "TAG", "Linha", "Executante", "Data da ocorrencia", "Observações",
    ]);
    assert.equal(table.headers.length, table.widths.length);
    table.rows.forEach((row) => assert.equal(row.length, table.headers.length));
  });

  it("do mais antigo para o mais novo, com a data como dia", () => {
    const table = rpExportTable([samplePublicRp({ id: "b", occurredAt: "2026-10-10T12:00:00.000Z" }), samplePublicRp({ id: "a" })], sampleDirectory, "");
    assert.deepEqual([cell(table, 0, "Data da ocorrencia"), cell(table, 1, "Data da ocorrencia")], [{ day: "2026-10-04" }, { day: "2026-10-10" }]);
  });

  it("preenche com o cadastro, o supervisor e os valores fixos de ação nova", () => {
    const rp = samplePublicRp({ problem: "Alarme", rootCause: "Sensor sujo", corrective: "Limpeza", orderNumber: "7005964" });
    const table = rpExportTable([rp], sampleDirectory, "Anderson");
    const values = ["N° Ação", "Problema", "Causa raiz", "Contra medida Corretiva", "Responsável", "Status", "Origem da Ação"].map((header) => cell(table, 0, header));
    assert.deepEqual(values, ["", "Alarme", "Sensor sujo", "Limpeza", "Anderson", "Em Andamento", "FSP"]);
    const place = ["ÁREA", "TAG", "Linha", "Executante", "Observações"].map((header) => cell(table, 0, header));
    assert.deepEqual(place, ["Fábrica 1", "EBS-BLI-31", "Cam 08", "Rogério B", ""]);
  });

  it("uma linha por contramedida preventiva, repetindo o resto do RP", () => {
    const rp = samplePublicRp({ preventive: "- Revisar plano de inspeção\n- ⁠Padronizar parâmetros" });
    const table = rpExportTable([rp], sampleDirectory, "Anderson");
    assert.equal(table.rows.length, 2);
    assert.deepEqual([cell(table, 0, "Contra medida Preventiva"), cell(table, 1, "Contra medida Preventiva")], ["Revisar plano de inspeção", "Padronizar parâmetros"]);
    assert.equal(cell(table, 1, "Problema"), cell(table, 0, "Problema"));
  });
});

describe("preventiveActions", () => {
  it("texto sem lista é uma ação só; vazio vira uma linha em branco", () => {
    assert.deepEqual(preventiveActions("Orientar o operador.\nConferir no turno."), ["Orientar o operador.\nConferir no turno."]);
    assert.deepEqual(preventiveActions("* Instruído o operador"), ["Instruído o operador"]);
    assert.deepEqual(preventiveActions(null), [""]);
  });

  it("separa por •, *, - ou número e junta a linha sem marcador ao item de cima", () => {
    const text = "• Informado o preparador\n\n• Orientada a operação\ncom ajuste do forno\n1. Medir 2.5 mm";
    assert.deepEqual(preventiveActions(text), ["Informado o preparador", "Orientada a operação\ncom ajuste do forno", "Medir 2.5 mm"]);
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

describe("dragSelection", () => {
  const ids = ["a", "b", "c", "d", "e"];

  it("marca do segurado até o que está debaixo do dedo, nos dois sentidos", () => {
    assert.deepEqual([...dragSelection(new Set(), ids, "b", "d")], ["b", "c", "d"]);
    assert.deepEqual([...dragSelection(new Set(), ids, "d", "b")].sort(), ["b", "c", "d"]);
  });

  it("mantém o que já estava marcado e não mexe no conjunto de antes", () => {
    const base = new Set(["e"]);
    assert.deepEqual([...dragSelection(base, ids, "a", "b")].sort(), ["a", "b", "e"]);
    assert.deepEqual([...base], ["e"]);
  });

  it("dedo fora de um RP conhecido deixa só o segurado", () => {
    assert.deepEqual([...dragSelection(new Set(), ids, "c", "zz")], ["c"]);
  });
});
