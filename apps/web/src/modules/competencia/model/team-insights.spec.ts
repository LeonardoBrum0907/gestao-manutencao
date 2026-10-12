import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { teamFixture } from "./team-fixture";
import { cellTone, teamKpis, trainingNeeds, viewPreset } from "./team-insights";

describe("resumo da Matriz da equipe", () => {
  it("conta modelos por cobertura e técnicos com PDI atrasado", () => {
    assert.deepEqual(teamKpis(teamFixture()), { covered: 1, total: 3, none: 1, short: 0, single: 1, pdiLate: 1 });
  });

  it("lista quem treinar: modelo mais grave primeiro e o técnico mais perto do corte primeiro", () => {
    const needs = trainingNeeds(teamFixture());
    assert.deepEqual(needs.map((need) => need.equipmentId), ["caixa", "cartucho"]);
    assert.deepEqual(needs[0].candidates.map((candidate) => [candidate.name, candidate.gap]), [["Caio", 5], ["Bia", 20]]);
    assert.deepEqual(needs[1].candidates.map((candidate) => candidate.name), ["Bia"]);
  });

  it("marca perto do corte só na visão de treino", () => {
    assert.equal(cellTone(74, 5, 80, "training"), "near");
    assert.equal(cellTone(69, 5, 80, "training"), "below");
    assert.equal(cellTone(74, 5, 80, "schedule"), "below");
    assert.equal(cellTone(80, 5, 80, "management"), "qualified");
    assert.equal(cellTone(null, 0, 80, "training"), "unscored");
  });

  it("a visão de gerência solta os grupos e ordena por quem domina mais", () => {
    assert.deepEqual(viewPreset("management"), { rowGroup: "none", sort: { key: "count", dir: -1 } });
    assert.equal(viewPreset("training").rowGroup, "shift");
  });
});
