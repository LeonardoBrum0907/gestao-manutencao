import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertLeadsTeamsChange, requireLeadsTeams } from "./role-leads-teams";

function fails(run: () => void, code: string, statusCode: number) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, code);
    assert.equal(error.statusCode, statusCode);
    return true;
  });
}

describe("função que lidera equipe", () => {
  it("lê a marca e recusa o que não é sim ou não", () => {
    assert.equal(requireLeadsTeams({ leadsTeams: true }), true);
    assert.equal(requireLeadsTeams({ leadsTeams: false }), false);
    fails(() => requireLeadsTeams({ leadsTeams: "sim" }), "invalid", 400);
    fails(() => requireLeadsTeams({}), "invalid", 400);
  });

  it("não liga a marca enquanto alguém com a função estiver dentro de equipe", () => {
    fails(() => assertLeadsTeamsChange(false, true, { leadingTeams: 0, inTeams: 2 }), "supervisor_not_member", 409);
    assert.doesNotThrow(() => assertLeadsTeamsChange(false, true, { leadingTeams: 0, inTeams: 0 }));
  });

  it("não desliga a marca enquanto alguém com a função liderar equipe", () => {
    fails(() => assertLeadsTeamsChange(true, false, { leadingTeams: 1, inTeams: 0 }), "supervisor_leads_team", 409);
    assert.doesNotThrow(() => assertLeadsTeamsChange(true, false, { leadingTeams: 0, inTeams: 0 }));
  });

  it("deixa gravar o mesmo valor de novo", () => {
    assert.doesNotThrow(() => assertLeadsTeamsChange(true, true, { leadingTeams: 3, inTeams: 0 }));
    assert.doesNotThrow(() => assertLeadsTeamsChange(false, false, { leadingTeams: 0, inTeams: 3 }));
  });
});
