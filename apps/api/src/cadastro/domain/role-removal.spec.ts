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
  it("recusa as funções do SIGEM, que a API recria ao subir", () => {
    fails(() => assertRoleCanBeRemoved("mecânico", 0), "role_is_default");
  });

  it("recusa quando existe colaborador com a função", () => {
    fails(() => assertRoleCanBeRemoved("caldeireiro", 2), "role_in_use");
  });

  it("permite função criada pelo gestor e sem uso", () => {
    assert.doesNotThrow(() => assertRoleCanBeRemoved("caldeireiro", 0));
  });
});
