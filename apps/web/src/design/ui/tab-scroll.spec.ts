import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tabBarScrollLeft } from "./tab-scroll";

// Regressão: no celular, Configurações › Avisos e a aba PDI da ficha abriam com a aba atual fora da faixa.
describe("tabBarScrollLeft", () => {
  it("rola para a direita até a aba escondida à direita aparecer inteira, com folga", () => {
    assert.equal(tabBarScrollLeft(0, 358, { start: 420, end: 500 }), 166);
  });

  it("rola para a esquerda quando a aba ficou escondida à esquerda", () => {
    assert.equal(tabBarScrollLeft(300, 358, { start: 100, end: 180 }), 76);
  });

  it("não passa do começo da faixa", () => {
    assert.equal(tabBarScrollLeft(50, 358, { start: 10, end: 90 }), 0);
  });

  it("não mexe quando a aba já está à vista", () => {
    assert.equal(tabBarScrollLeft(0, 358, { start: 100, end: 200 }), 0);
    assert.equal(tabBarScrollLeft(120, 358, { start: 200, end: 470 }), 120);
  });
});
