import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { memberRecordStatus } from "./record-status";

describe("situação dos registros na ficha do colaborador", () => {
  // Regressão: a ficha usava a palavra genérica ("Aberto"/"Concluído") para tarefa e problema.
  it("usa a palavra do tipo, como a lista de Registros", () => {
    assert.equal(memberRecordStatus({ type: "task", status: "open" }), "Aberta");
    assert.equal(memberRecordStatus({ type: "task", status: "done" }), "Concluída");
    assert.equal(memberRecordStatus({ type: "problem", status: "done" }), "Resolvido");
    assert.equal(memberRecordStatus({ type: "problem", status: "in_progress" }), "Em andamento");
  });

  it("feedback fica sem situação", () => {
    assert.equal(memberRecordStatus({ type: "feedback", status: "open" }), null);
  });
});
