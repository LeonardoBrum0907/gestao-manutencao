import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { opensInModal, recordKindName, recordStatusLabel } from "./record";

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

describe("nome do registro na tela", () => {
  it("feedback de Registros se chama Observação", () => {
    assert.equal(recordKindName({ type: "feedback", origin: "inbox" }), "Observação");
  });

  it("o gravado na ficha do colaborador é o Feedback", () => {
    assert.equal(recordKindName({ type: "feedback", origin: "ficha" }), "Feedback");
  });

  it("os outros tipos mantêm o nome", () => {
    assert.equal(recordKindName({ type: "task", origin: "inbox" }), "Tarefa");
  });
});
