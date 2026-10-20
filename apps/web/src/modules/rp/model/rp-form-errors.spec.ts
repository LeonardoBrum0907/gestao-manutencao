import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyRpValues } from "./rp";
import { rpFormErrors } from "./rp-form-errors";

// Regressão: sem fábrica, o "Escolha a fábrica." da API aparecia só embaixo do botão Salvar, longe do campo.
describe("erros da ficha de RP do coordenador", () => {
  const filled = { ...emptyRpValues(), occurredAt: "2026-10-04", factoryId: "f1", problem: "Alarme na esteira" };

  it("ficha completa não tem erro", () => {
    assert.deepEqual(rpFormErrors(filled), {});
  });

  it("aponta cada campo que a API recusa vazio", () => {
    assert.deepEqual(rpFormErrors({ ...filled, factoryId: "" }), { factoryId: "Escolha a fábrica." });
    assert.deepEqual(rpFormErrors({ ...filled, occurredAt: "" }), { occurredAt: "Informe a data do relatório." });
    assert.deepEqual(rpFormErrors({ ...filled, problem: "   " }), { problem: "Descreva o que ocorreu." });
  });

  it("os campos opcionais (linha, TAG, técnicos, causas) não viram erro", () => {
    assert.deepEqual(rpFormErrors({ ...filled, line: "", tag: "", memberIds: [], rootCause: "" }), {});
  });
});
