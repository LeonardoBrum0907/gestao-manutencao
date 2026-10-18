import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { positionForRole, roleMetaText } from "./member-role";

describe("cargo pela função", () => {
  it("dá supervisor para a função que lidera equipe e técnico para as outras", () => {
    assert.equal(positionForRole({ leadsTeams: true }, "technician"), "supervisor");
    assert.equal(positionForRole({ leadsTeams: false }, "supervisor"), "technician");
  });

  it("sem função escolhida, fica o cargo que já estava", () => {
    assert.equal(positionForRole(undefined, "supervisor"), "supervisor");
    assert.equal(positionForRole(undefined, "technician"), "technician");
  });
});

describe("texto ao lado da função", () => {
  it("diz quando a função lidera equipe e quantos a usam", () => {
    assert.equal(roleMetaText({ leadsTeams: true }, "2 colaboradores"), "Lidera equipe · 2 colaboradores");
    assert.equal(roleMetaText({ leadsTeams: false }, "sem uso"), "sem uso");
    assert.equal(roleMetaText({ leadsTeams: true }, ""), "Lidera equipe");
  });
});
