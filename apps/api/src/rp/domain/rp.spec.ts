import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeOrder, normalizeProblem } from "./rp";

describe("chaves de duplicidade", () => {
  it("normaliza a ordem sem espaços, pontos nem caixa", () => {
    assert.equal(normalizeOrder(" 123.456 AB "), "123456ab");
    assert.equal(normalizeOrder("  "), null);
    assert.equal(normalizeOrder(null), null);
  });

  it("normaliza o problema sem acento, pontuação nem espaços repetidos", () => {
    assert.equal(normalizeProblem("  Alarme  de Posição, na esteira. "), "alarme de posicao na esteira");
  });
});
