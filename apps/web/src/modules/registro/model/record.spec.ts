import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { opensInModal, recordStatusLabel } from "./record";

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

describe("registro que abre no modal", () => {
  it("o da Entrada e a observação da ficha se editam no modal", () => {
    assert.equal(opensInModal("inbox"), true);
    assert.equal(opensInModal("ficha"), true);
  });

  it("chamado, ocorrência e RP mudam na ficha de origem", () => {
    for (const origin of ["chamado", "ocorrencia", "rp"] as const) assert.equal(opensInModal(origin), false);
  });
});
