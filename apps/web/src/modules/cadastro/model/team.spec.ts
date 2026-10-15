import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { memberStatusNote, teamCandidateLabel } from "./team";

describe("técnico na equipe", () => {
  it("só marca a situação de quem não está ativo", () => {
    assert.equal(memberStatusNote({ status: "active" }), null);
    assert.equal(memberStatusNote({ status: "inactive" }), "Inativo");
    assert.equal(memberStatusNote({ status: "vacation" }), "Férias");
  });

  // Regressão: o técnico inativo aparecia em "Adicionar técnico…" igual aos ativos.
  it("Adicionar técnico mostra a situação e a equipe que ele deixa", () => {
    assert.equal(teamCandidateLabel({ name: "João", status: "active" }, null), "João");
    assert.equal(teamCandidateLabel({ name: "João", status: "active" }, "Turno A"), "João (sai de Turno A)");
    assert.equal(teamCandidateLabel({ name: "Ana", status: "inactive" }, null), "Ana (Inativo)");
    assert.equal(teamCandidateLabel({ name: "Ana", status: "away" }, "Turno A"), "Ana (Afastado, sai de Turno A)");
  });
});
