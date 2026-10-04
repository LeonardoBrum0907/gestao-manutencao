import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertCanLead, assertTeamCanBeRemoved, assertTeamNameAvailable } from "./team";

function fails(run: () => void, code: string, statusCode: number) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, code);
    assert.equal(error.statusCode, statusCode);
    return true;
  });
}

describe("equipe", () => {
  it("recusa nome já usado por outra equipe", () => {
    fails(() => assertTeamNameAvailable("outra", null), "team_name_taken", 409);
    fails(() => assertTeamNameAvailable("outra", "esta"), "team_name_taken", 409);
    assert.doesNotThrow(() => assertTeamNameAvailable("esta", "esta"));
    assert.doesNotThrow(() => assertTeamNameAvailable(null, null));
  });

  it("só aceita supervisor para liderar", () => {
    fails(() => assertCanLead("technician"), "not_supervisor", 400);
    assert.doesNotThrow(() => assertCanLead("supervisor"));
  });

  it("recusa excluir equipe com gente dentro", () => {
    fails(() => assertTeamCanBeRemoved(3), "team_in_use", 409);
    assert.doesNotThrow(() => assertTeamCanBeRemoved(0));
  });
});
