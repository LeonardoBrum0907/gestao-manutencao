import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { basicConditionAnswer, canonicalBasicConditionImpact } from "./rp-basic-condition";

describe("basicConditionAnswer: Sim ou Não do impacto em condição básica", () => {
  it("lê Sim e Não escritos de vários jeitos", () => {
    const answers = ["Sim", "sim.", "SIM, faca 2 sem ajuste", "Não", "não", "NAO.", "Nao, sem impacto"].map(basicConditionAnswer);
    assert.deepEqual(answers, ["Sim", "Sim", "Sim", "Não", "Não", "Não", "Não"]);
  });

  // Valores que já estão no banco de produção (conferidos em 2026-10-31).
  it("lê o quadrinho marcado do modelo do WhatsApp", () => {
    assert.equal(basicConditionAnswer("(  ) Sim.  ( X ) Não."), "Não");
    assert.equal(basicConditionAnswer("( x ) Sim.  (  ) Não."), "Sim");
    assert.equal(basicConditionAnswer("(X)Sim ( )Não"), "Sim");
  });

  it("conta N/A e não se aplica como Não", () => {
    assert.deepEqual(["N/A", "NA", "n/a.", "Não se aplica"].map(basicConditionAnswer), ["Não", "Não", "Não", "Não"]);
  });

  it("devolve null quando o texto não diz Sim nem Não", () => {
    assert.deepEqual(["", null, undefined, "Necessita qualificação", "simulação", "( ) Sim ( ) Não"].map(basicConditionAnswer), [null, null, null, null, null, null]);
  });
});

describe("canonicalBasicConditionImpact: valor a gravar", () => {
  it("troca o que dá para ler por Sim ou Não", () => {
    assert.equal(canonicalBasicConditionImpact(" não "), "Não");
    assert.equal(canonicalBasicConditionImpact("N/A"), "Não");
  });

  it("guarda o texto que não dá para ler, sem espaços nas pontas", () => {
    assert.equal(canonicalBasicConditionImpact("  Precisa requalificar  "), "Precisa requalificar");
  });

  it("devolve null para vazio", () => {
    assert.deepEqual([canonicalBasicConditionImpact(""), canonicalBasicConditionImpact("   "), canonicalBasicConditionImpact(null)], [null, null, null]);
  });
});
