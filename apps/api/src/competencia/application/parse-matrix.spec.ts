import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { parseBulk } from "./parse-matrix";

const invalid = (error: unknown) => error instanceof DomainError && error.code === "invalid";

describe("várias notas de uma vez", () => {
  it("lê cada nota com a regra da nota única", () => {
    assert.deepEqual(parseBulk({ entries: [{ skillId: "a", score: 3 }, { skillId: "b", notApplicable: true }] }), [
      { skillId: "a", input: { score: 3, notApplicable: false, expected: null } },
      { skillId: "b", input: { score: null, notApplicable: true, expected: null } },
    ]);
  });

  it("recusa lista vazia, grande demais, repetida ou sem habilidade", () => {
    assert.throws(() => parseBulk({ entries: [] }), invalid);
    assert.throws(() => parseBulk({}), invalid);
    assert.throws(() => parseBulk({ entries: Array.from({ length: 501 }, (_, i) => ({ skillId: `s${i}`, score: 1 })) }), invalid);
    assert.throws(() => parseBulk({ entries: [{ skillId: "a", score: 1 }, { skillId: "a", score: 2 }] }), invalid);
    assert.throws(() => parseBulk({ entries: [{ score: 1 }] }), invalid);
  });
});
