import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { requireGradeExpected } from "./grade-expected";

describe("esperado do grau", () => {
  it("lê o esperado de cada dificuldade e deixa vazio o que não veio", () => {
    assert.deepEqual(requireGradeExpected({ expected: { intermediate: 2, advanced: 1 } }), { basic: null, intermediate: 2, advanced: 1 });
  });

  it("null volta para o padrão da dificuldade", () => {
    assert.deepEqual(requireGradeExpected({ expected: { basic: null, intermediate: null, advanced: null } }), {
      basic: null,
      intermediate: null,
      advanced: null,
    });
  });

  it("recusa esperado fora de 1 a 4", () => {
    assert.throws(() => requireGradeExpected({ expected: { basic: 0 } }), DomainError);
    assert.throws(() => requireGradeExpected({ expected: { advanced: 5 } }), DomainError);
    assert.throws(() => requireGradeExpected({ expected: { advanced: 2.5 } }), DomainError);
    assert.throws(() => requireGradeExpected({ expected: { advanced: "2" } }), DomainError);
  });

  it("recusa corpo sem o objeto expected", () => {
    assert.throws(() => requireGradeExpected({}), DomainError);
  });
});
