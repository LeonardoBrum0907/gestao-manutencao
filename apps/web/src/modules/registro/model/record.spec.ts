import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { recordStatusLabel } from "./record";

describe("situação do registro", () => {
  it("usa a palavra de cada tipo, como a lista de Registros mostra", () => {
    assert.equal(recordStatusLabel("task", "open"), "Aberta");
    assert.equal(recordStatusLabel("task", "done"), "Concluída");
    assert.equal(recordStatusLabel("problem", "open"), "Aberto");
    assert.equal(recordStatusLabel("problem", "done"), "Resolvido");
    assert.equal(recordStatusLabel("feedback", "open"), "A conversar");
    assert.equal(recordStatusLabel("entry", "open"), "Rascunho");
  });

  it("em andamento é igual para tarefa e problema", () => {
    assert.equal(recordStatusLabel("task", "in_progress"), "Em andamento");
    assert.equal(recordStatusLabel("problem", "in_progress"), "Em andamento");
  });
});
