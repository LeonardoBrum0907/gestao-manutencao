import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertMemberCanBeRemoved } from "./member-removal";

describe("exclusão de colaborador", () => {
  it("recusa quando ele aparece em algum registro", () => {
    assert.throws(() => assertMemberCanBeRemoved(2), (error: unknown) => {
      assert.ok(error instanceof DomainError);
      assert.equal(error.statusCode, 409);
      assert.equal(error.code, "member_in_use");
      return true;
    });
  });

  it("permite quando ele não aparece em nenhum registro", () => {
    assert.doesNotThrow(() => assertMemberCanBeRemoved(0));
  });
});
