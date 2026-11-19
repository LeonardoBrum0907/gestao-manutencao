import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyRpValues } from "./rp";
import { requiredFieldErrors } from "./rp-required";

describe("campos obrigatórios do RP", () => {
  it("dá a mensagem só para o campo vazio pedido", () => {
    const values = { ...emptyRpValues(), occurredAt: "", problem: "Parou", memberIds: [] };
    assert.deepEqual(requiredFieldErrors(values, ["occurredAt", "problem", "memberIds"]), {
      occurredAt: "Informe a data do relatório.",
      memberIds: "Escolha pelo menos um técnico.",
    });
  });

  it("texto só com espaços conta como vazio", () => {
    assert.deepEqual(requiredFieldErrors({ ...emptyRpValues(), problem: "   " }, ["problem"]), { problem: "Descreva o que ocorreu." });
  });
});
