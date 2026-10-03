import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertGradeCanBeRemoved } from "./grade-removal";

describe("exclusão de grau", () => {
  it("recusa quando existe técnico com o grau", () => {
    assert.throws(() => assertGradeCanBeRemoved(1), (error: unknown) => {
      assert.ok(error instanceof DomainError);
      assert.equal(error.statusCode, 409);
      assert.equal(error.code, "grade_in_use");
      return true;
    });
  });

  it("permite quando nenhum técnico usa o grau", () => {
    assert.doesNotThrow(() => assertGradeCanBeRemoved(0));
  });
});
