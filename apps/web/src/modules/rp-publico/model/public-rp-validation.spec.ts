import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { newPublicValues } from "./public-rp";
import { publicRpFormErrors } from "./public-rp-validation";

const filled = { ...newPublicValues("m1"), occurredAt: "2026-10-18", factoryId: "f1", problem: "Esteira travando" };

describe("publicRpFormErrors", () => {
  it("formulário completo não tem erro", () => {
    assert.deepEqual(publicRpFormErrors(filled), {});
  });

  it("um erro por campo obrigatório vazio", () => {
    const errors = publicRpFormErrors({ ...filled, occurredAt: "", factoryId: "", problem: "  ", memberIds: [] });
    assert.deepEqual(Object.keys(errors).sort(), ["factoryId", "memberIds", "occurredAt", "problem"]);
    assert.equal(errors.memberIds, "Escolha pelo menos um técnico.");
  });

  it("texto longo demais diz o tamanho recebido e o máximo", () => {
    const errors = publicRpFormErrors({ ...filled, rootCause: "x".repeat(2001), tag: "t".repeat(121) });
    assert.equal(errors.rootCause, "Passou do tamanho: 2001 caracteres (máximo 2000).");
    assert.equal(errors.tag, "Passou do tamanho: 121 caracteres (máximo 120).");
  });
});
