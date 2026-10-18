import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertRoleCanBeRemoved } from "./role-removal";

function fails(run: () => void, code: string) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.statusCode, 409);
    assert.equal(error.code, code);
    return true;
  });
}

describe("exclusão de função", () => {
  it("recusa quando existe colaborador com a função", () => {
    fails(() => assertRoleCanBeRemoved(2), "role_in_use");
  });

  // A API não recria mais as funções do SIGEM ao subir, então elas também saem quando ninguém usa.
  it("permite qualquer função sem uso, inclusive as do SIGEM", () => {
    assert.doesNotThrow(() => assertRoleCanBeRemoved(0));
  });
});
