import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TeamColumnBlock } from "./team-columns";
import { sheetColumnPages } from "./team-sheet-pages";

function block(id: string, size: number): TeamColumnBlock {
  const columns = Array.from({ length: size }, (_, index) => ({ id: `${id}-${index}`, equipmentId: `e${index}`, label: `M${index}`, detail: null }));
  return { id, label: id, detail: null, columns };
}

const shape = (pages: TeamColumnBlock[][]) => pages.map((page) => page.map((piece) => `${piece.id}:${piece.columns.length}`));

describe("colunas da folha A4 repartidas em folhas", () => {
  it("cabe tudo numa folha", () => {
    assert.deepEqual(shape(sheetColumnPages([block("a", 3), block("b", 3)], 6)), [["a:3", "b:3"]]);
  });

  it("passa para a folha seguinte sem quebrar a linha de produção", () => {
    assert.deepEqual(shape(sheetColumnPages([block("a", 3), block("b", 3), block("c", 3)], 7)), [["a:3", "b:3"], ["c:3"]]);
  });

  it("corta só o bloco maior que uma folha", () => {
    assert.deepEqual(shape(sheetColumnPages([block("a", 2), block("b", 9)], 4)), [["a:2"], ["b:4"], ["b:4"], ["b:1"]]);
  });

  it("sem colunas, nenhuma folha", () => {
    assert.deepEqual(sheetColumnPages([], 4), []);
  });
});
