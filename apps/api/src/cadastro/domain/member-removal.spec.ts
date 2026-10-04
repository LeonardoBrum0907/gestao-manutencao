import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertMemberCanBeRemoved } from "./member-removal";

function fails(run: () => void, code: string) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.statusCode, 409);
    assert.equal(error.code, code);
    return true;
  });
}

describe("exclusão de colaborador", () => {
  it("recusa quando ele aparece em algum registro", () => {
    fails(() => assertMemberCanBeRemoved(2, 0, 0), "member_in_use");
  });

  it("recusa quando ele é supervisor de alguma equipe", () => {
    fails(() => assertMemberCanBeRemoved(0, 1, 0), "supervisor_leads_team");
  });

  it("recusa quando ele tem anexos no PDI, para o arquivo não ficar perdido no disco", () => {
    fails(() => assertMemberCanBeRemoved(0, 0, 1), "member_has_files");
  });

  it("permite quando ele não aparece em registro, não lidera equipe nem tem anexo", () => {
    assert.doesNotThrow(() => assertMemberCanBeRemoved(0, 0, 0));
  });
});
