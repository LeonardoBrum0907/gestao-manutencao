import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compareSortValues, groupRows, nextSort, sortRows } from "./table-sort";

describe("compareSortValues", () => {
  it("ignora maiúsculas e acentos e compara números dentro do texto", () => {
    assert.equal(compareSortValues("blistadeira", "Blistadeira", "asc"), 0);
    assert.ok(compareSortValues("Anésio", "Anderson", "asc") > 0);
    assert.ok(compareSortValues("MED 2", "MED 10", "asc") < 0);
  });

  it("compara números pela grandeza e inverte na ordem decrescente", () => {
    assert.ok(compareSortValues(9, 10, "asc") < 0);
    assert.ok(compareSortValues(9, 10, "desc") > 0);
  });

  it("deixa vazios no fim nas duas direções", () => {
    assert.ok(compareSortValues(null, "Celso", "asc") > 0);
    assert.ok(compareSortValues(null, "Celso", "desc") > 0);
    assert.ok(compareSortValues("", 3, "asc") > 0);
    assert.equal(compareSortValues(undefined, null, "asc"), 0);
  });
});

describe("sortRows", () => {
  it("ordena uma cópia e mantém a ordem de chegada nos empates", () => {
    const rows = [
      { id: "a", grade: "Sênior" },
      { id: "b", grade: null },
      { id: "c", grade: "Júnior" },
      { id: "d", grade: "Sênior" },
    ];
    const sorted = sortRows(rows, (row) => row.grade, "asc");
    assert.deepEqual(sorted.map((row) => row.id), ["c", "a", "d", "b"]);
    assert.deepEqual(rows.map((row) => row.id), ["a", "b", "c", "d"]);
  });
});

describe("groupRows", () => {
  it("junta na ordem em que cada grupo aparece primeiro", () => {
    const rows = [
      { name: "Balança", line: "MED 02" },
      { name: "Blistadeira", line: "CAM 01" },
      { name: "Encaixotadora", line: "MED 02" },
    ];
    const groups = groupRows(rows, (row) => ({ key: row.line, title: `Linha ${row.line}` }));
    assert.deepEqual(
      groups.map((group) => [group.title, group.rows.map((row) => row.name)]),
      [
        ["Linha MED 02", ["Balança", "Encaixotadora"]],
        ["Linha CAM 01", ["Blistadeira"]],
      ],
    );
  });
});

describe("nextSort", () => {
  it("começa crescente numa coluna nova e inverte na mesma coluna", () => {
    assert.deepEqual(nextSort(null, "name"), { key: "name", direction: "asc" });
    assert.deepEqual(nextSort({ key: "name", direction: "asc" }, "name"), { key: "name", direction: "desc" });
    assert.deepEqual(nextSort({ key: "name", direction: "desc" }, "grade"), { key: "grade", direction: "asc" });
  });
});
