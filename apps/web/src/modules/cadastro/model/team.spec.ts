import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { memberStatusNote, teamCandidateLabel, teamHeadcountLabel } from "./team";

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

// Regressão: o cartão dizia "2 técnicos" contando o inativo, e a Matriz da equipe mostrava 1.
describe("contagem de técnicos no cartão da equipe", () => {
  const active = { status: "active" as const };
  const inactive = { status: "inactive" as const };

  it("só diz o total quando todos estão ativos", () => {
    assert.equal(teamHeadcountLabel([]), "0 técnicos");
    assert.equal(teamHeadcountLabel([active]), "1 técnico");
    assert.equal(teamHeadcountLabel([active, active]), "2 técnicos");
  });

  it("diz quantos estão ativos quando alguém está fora", () => {
    assert.equal(teamHeadcountLabel([inactive, active]), "2 técnicos, 1 ativo");
    assert.equal(teamHeadcountLabel([active, { status: "vacation" }, active]), "3 técnicos, 2 ativos");
    assert.equal(teamHeadcountLabel([inactive]), "1 técnico, nenhum ativo");
  });
});
