import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertGradeNameAvailable } from "./grade-name";

describe("nome do grau", () => {
  it("recusa quando outro grau já usa o nome", () => {
    assert.throws(() => assertGradeNameAvailable("outro", null), (error: unknown) => {
      assert.ok(error instanceof DomainError);
      assert.equal(error.statusCode, 409);
      return true;
    });
  });

  it("permite o próprio nome na edição", () => {
    assert.doesNotThrow(() => assertGradeNameAvailable("atual", "atual"));
  });

  it("permite nome livre", () => {
    assert.doesNotThrow(() => assertGradeNameAvailable(null, null));
  });
});
