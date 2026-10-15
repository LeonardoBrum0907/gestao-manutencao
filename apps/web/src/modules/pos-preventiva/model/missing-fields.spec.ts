import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { missingFieldsNotice } from "./missing-fields";
import { emptyValues } from "./post-preventive";

const filled = {
  ...emptyValues("2026-10-15"),
  lineId: "l1",
  machineId: "m1",
  subassemblyId: "s1",
  memberIds: ["t1"],
  done: "Troca das válvulas",
  occurrence: "Quebra do cilindro",
  preventiveAction: "Revisar o cilindro",
  attentionPoint: "Olhar o cilindro",
};

describe("aviso dos campos que faltam na ficha pós-preventiva", () => {
  it("lista todos os vazios de uma vez, na ordem do formulário", () => {
    assert.equal(
      missingFieldsNotice(emptyValues("2026-10-15")),
      "Falta preencher: Máquina, Subconjunto, O que foi feito, Ocorrência, Ação preventiva, Ponto de atenção e Técnicos.",
    );
  });

  it("fala de um campo só sem vírgula nem 'e'", () => {
    assert.equal(missingFieldsNotice({ ...filled, memberIds: [] }), "Falta preencher: Técnicos.");
  });

  it("conta texto só com espaços como vazio", () => {
    assert.equal(missingFieldsNotice({ ...filled, done: "  ", occurrence: "\n" }), "Falta preencher: O que foi feito e Ocorrência.");
  });

  it("não avisa nada com a ficha completa", () => {
    assert.equal(missingFieldsNotice(filled), null);
  });
});
