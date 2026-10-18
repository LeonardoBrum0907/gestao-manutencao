import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseBulkReview } from "./parse-bulk-review";

describe("parseBulkReview", () => {
  it("aprovar não leva texto e junta ids repetidos", () => {
    assert.deepEqual(parseBulkReview({ ids: ["a", "b", "a"], action: "approve", note: "x" }), { ids: ["a", "b"], action: "approve", note: null });
  });

  it("recusar aceita motivo vazio", () => {
    assert.equal(parseBulkReview({ ids: ["a"], action: "reject", note: "  " }).note, null);
    assert.equal(parseBulkReview({ ids: ["a"], action: "reject", note: " Fora do padrão " }).note, "Fora do padrão");
  });

  it("pedir revisão exige o que revisar", () => {
    assert.throws(() => parseBulkReview({ ids: ["a"], action: "request_review" }), /Escreva o que precisa revisar/);
  });

  it("recusa ação desconhecida, lista vazia ou grande demais", () => {
    assert.throws(() => parseBulkReview({ ids: ["a"], action: "delete" }), /recebido: delete; esperado: approve, reject ou request_review/);
    assert.throws(() => parseBulkReview({ ids: [], action: "approve" }), /de 1 a 100 RPs \(recebido: 0\)/);
    assert.throws(() => parseBulkReview({ ids: Array.from({ length: 101 }, (_, i) => `rp${i}`), action: "approve" }), /recebido: 101/);
    assert.throws(() => parseBulkReview({ ids: "a", action: "approve" }), /lista de ids/);
  });

  it("texto longo demais é recusado com o tamanho", () => {
    assert.throws(() => parseBulkReview({ ids: ["a"], action: "reject", note: "x".repeat(1001) }), /recebido: 1001 caracteres; máximo: 1000/);
  });
});
