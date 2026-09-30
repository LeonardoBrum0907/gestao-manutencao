import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertFactoryCanBeRemoved } from "./factory-removal";

describe("exclusão de fábrica", () => {
  it("recusa quando existe máquina", () => {
    assert.throws(() => assertFactoryCanBeRemoved(1), (error: unknown) => {
      assert.ok(error instanceof DomainError);
      assert.equal(error.statusCode, 409);
      return true;
    });
  });

  it("permite quando não há máquina", () => {
    assert.doesNotThrow(() => assertFactoryCanBeRemoved(0));
  });
});
