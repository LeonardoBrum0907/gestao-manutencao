import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { causeDetail } from "./rp-cause";

describe("detalhe da causa do 4M", () => {
  it("tira o X da marca e os parênteses do detalhe", () => {
    assert.equal(causeDetail("X (FERRAMENTAL)"), "FERRAMENTAL");
    assert.equal(causeDetail("(X) desgaste da correia"), "desgaste da correia");
    assert.equal(causeDetail("x - falta de lubrificação"), "falta de lubrificação");
  });

  it("marca sem detalhe fica sem texto", () => {
    assert.equal(causeDetail("X"), null);
    assert.equal(causeDetail("sim"), null);
    assert.equal(causeDetail(" Sim. "), null);
  });

  it("mantém o texto quando não começa com marca", () => {
    assert.equal(causeDetail("Xícara do eixo trincada"), "Xícara do eixo trincada");
    assert.equal(causeDetail("Simulação errada no setup"), "Simulação errada no setup");
    assert.equal(causeDetail("y"), "y");
  });
});
