import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_TEAM_MATRIX_LAYOUT } from "@manutencao/shared";
import { teamFixture } from "./team-fixture";
import { canDragColumns, teamGrid, type TeamGridState } from "./team-grid";

const base: TeamGridState = { layout: DEFAULT_TEAM_MATRIX_LAYOUT, shift: "", focus: null, lineIds: [], sort: { key: "name", dir: 1 } };

describe("grade da Matriz da equipe", () => {
  it("filtra técnicos pelo turno e por PDI atrasado", () => {
    assert.equal(teamGrid(teamFixture(), { ...base, shift: "first" }).memberCount, 2);
    const late = teamGrid(teamFixture(), { ...base, focus: "pdi" });
    assert.deepEqual(late.rowBlocks.flatMap((block) => block.members.map((member) => member.name)), ["Ana"]);
    assert.equal(late.columns.length, 4);
  });

  it("número do topo de cobertura filtra as colunas pelo status do modelo", () => {
    const grid = teamGrid(teamFixture(), { ...base, focus: "none" });
    assert.deepEqual(grid.columns.map((column) => column.id), ["caixa"]);
    assert.equal(grid.memberCount, 4);
  });

  it("só deixa arrastar coluna sem filtro de colunas", () => {
    assert.equal(canDragColumns({ lineIds: [], focus: null }), true);
    assert.equal(canDragColumns({ lineIds: [], focus: "pdi" }), true);
    assert.equal(canDragColumns({ lineIds: ["l1"], focus: null }), false);
    assert.equal(canDragColumns({ lineIds: [], focus: "none" }), false);
  });
});
