import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { testResultText } from "./push-result";

describe("avisos: resultado do aviso de teste", () => {
  it("conta os aparelhos que receberam", () => {
    assert.equal(testResultText({ sent: 1, removed: 0, failed: 0 }), "Aviso de teste enviado para 1 aparelho.");
    assert.equal(testResultText({ sent: 2, removed: 0, failed: 0 }), "Aviso de teste enviado para 2 aparelhos.");
  });

  it("explica removidos e falhas", () => {
    assert.equal(
      testResultText({ sent: 0, removed: 1, failed: 1 }),
      "O aviso de teste não chegou a nenhum aparelho. 1 aparelho saiu da lista porque não aceita mais avisos. 1 aparelho não respondeu; tente de novo mais tarde.",
    );
  });

  it("sem aparelho inscrito diz que ninguém recebe", () => {
    assert.equal(testResultText({ sent: 0, removed: 0, failed: 0 }), "Nenhum aparelho recebe avisos ainda.");
  });
});
