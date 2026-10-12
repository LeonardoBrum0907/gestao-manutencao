import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { teamFixture } from "../../competencia/model/team-fixture";
import { coverageRows, pdiOverdueTotal, trainingTop } from "./overview-team";

describe("equipe no Dashboard", () => {
  it("cobertura do mais grave para o coberto, com os três turnos", () => {
    const team = teamFixture();
    team.equipments[0].qualifiedByShift = { first: 1, second: 1 };
    const rows = coverageRows(team);
    assert.deepEqual(rows.map((row) => row.status), ["none", "single", "ok"]);
    assert.deepEqual(rows[2].byShift, [1, 1, 0]);
  });

  it("deixa de fora modelo sem mínimo que ninguém tem na matriz", () => {
    const team = teamFixture();
    team.equipments.push({ id: "uhlmann", name: "Blistadeira Uhlmann", minQualified: 0, qualified: 0, qualifiedByShift: {}, status: "none" });
    assert.equal(coverageRows(team).some((row) => row.id === "uhlmann"), false);
    team.equipments[3].minQualified = 1;
    assert.equal(coverageRows(team).some((row) => row.id === "uhlmann"), true);
  });

  it("quem treinar: os mais perto do corte entre os modelos em risco", () => {
    const top = trainingTop(teamFixture(), 2);
    assert.deepEqual(
      top.map((pick) => [pick.name, pick.equipmentName, pick.gap]),
      [
        ["Caio", "Encaixotadora CAM", 5],
        ["Bia", "Encartuchadeira CAM", 8],
      ],
    );
  });

  it("soma o PDI vencido da equipe", () => {
    assert.equal(pdiOverdueTotal(teamFixture()), 2);
  });
});
