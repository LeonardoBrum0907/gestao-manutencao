import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { byLayoutOrder, moveColumn, teamColumnBlocks, UNLINKED_BLOCK_ID } from "./team-columns";
import { teamFixture } from "./team-fixture";

const noFilter = { status: null, lineIds: [] };
const ids = (blocks: ReturnType<typeof teamColumnBlocks>) => blocks.map((block) => [block.id, block.columns.map((column) => column.id)]);

describe("colunas da Matriz da equipe", () => {
  it("põe na ordem salva e manda o que não está nela para o fim, na ordem de chegada", () => {
    assert.deepEqual(byLayoutOrder([{ id: "a" }, { id: "b" }, { id: "c" }], ["c", "x"]).map((item) => item.id), ["c", "a", "b"]);
  });

  it("por linha: máquinas das linhas cadastradas e, no fim, o modelo sem máquina", () => {
    const blocks = teamColumnBlocks(teamFixture(), "line", [], noFilter);
    assert.deepEqual(ids(blocks), [["cam05", ["m1", "m2"]], ["cam08", ["m3"]], [UNLINKED_BLOCK_ID, ["caixa"]]]);
    assert.equal(blocks[0].columns[0].detail, "Blistadeira CAM");
    assert.equal(blocks[1].columns[0].detail, null);
  });

  it("por modelo: um bloco só, na ordem arrastada", () => {
    assert.deepEqual(ids(teamColumnBlocks(teamFixture(), "model", ["caixa"], noFilter)), [[null, ["caixa", "blister", "cartucho"]]]);
  });

  it("segue a ordem arrastada de linhas e de máquinas", () => {
    assert.deepEqual(ids(teamColumnBlocks(teamFixture(), "line", ["cam08", "m2"], noFilter)).slice(0, 2), [["cam08", ["m3"]], ["cam05", ["m2", "m1"]]]);
  });

  it("filtra pelo status do modelo e pelas linhas escolhidas, tirando bloco vazio", () => {
    assert.deepEqual(ids(teamColumnBlocks(teamFixture(), "line", [], { status: "single", lineIds: [] })), [["cam05", ["m2"]]]);
    assert.deepEqual(ids(teamColumnBlocks(teamFixture(), "line", [], { status: null, lineIds: ["cam08"] })), [["cam08", ["m3"]]]);
  });

  it("arrastar troca só a ordem relativa entre irmãos e mantém o resto da ordem", () => {
    assert.deepEqual(moveColumn(["a", "b", "c"], "c", "a", ["l1", "b"]), ["l1", "c", "a", "b"]);
    assert.deepEqual(moveColumn(["a", "b"], "a", "z", ["a"]), ["a"]);
  });
});
