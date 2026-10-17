import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { requireRoleMatrixCategory } from "./role-matrix-category";

describe("categoria da matriz por função", () => {
  it("aceita mecânico, eletricista e vazio (as duas)", () => {
    assert.equal(requireRoleMatrixCategory({ category: "mechanical" }), "mechanical");
    assert.equal(requireRoleMatrixCategory({ category: "electrical" }), "electrical");
    assert.equal(requireRoleMatrixCategory({ category: null }), null);
    assert.equal(requireRoleMatrixCategory({ category: "" }), null);
  });

  it("recusa outro valor ou corpo sem o campo", () => {
    for (const body of [{ category: "eletricista" }, {}, null]) {
      assert.throws(() => requireRoleMatrixCategory(body), (error: unknown) => error instanceof DomainError && error.statusCode === 400);
    }
  });
});
