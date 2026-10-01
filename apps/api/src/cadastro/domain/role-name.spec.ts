import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertRoleNameAvailable } from "./role-name";

describe("nome da função", () => {
  it("recusa quando outra função já usa o nome", () => {
    assert.throws(() => assertRoleNameAvailable("outra", null), (error: unknown) => {
      assert.ok(error instanceof DomainError);
      assert.equal(error.statusCode, 409);
      return true;
    });
  });

  it("permite o próprio nome na edição", () => {
    assert.doesNotThrow(() => assertRoleNameAvailable("atual", "atual"));
  });

  it("permite nome livre", () => {
    assert.doesNotThrow(() => assertRoleNameAvailable(null, null));
  });
});
