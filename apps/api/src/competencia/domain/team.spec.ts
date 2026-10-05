import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MatrixCatalogDto } from "@manutencao/shared";
import type { MatrixEntry } from "./matrix";
import { buildTeamMatrix, coverageStatus, type TeamMemberInput } from "./team";

const catalog: MatrixCatalogDto = {
  equipments: [
    { id: "e1", name: "Blistadeira", archived: false, minQualified: 2 },
    { id: "e2", name: "Encartuchadeira", archived: false, minQualified: 0 },
    { id: "e3", name: "Antiga", archived: true, minQualified: 0 },
  ],
  skills: [
    { id: "s1", equipmentId: "e1", subgroup: "A", text: "a", level: "basic", archived: false },
    { id: "s2", equipmentId: "e1", subgroup: "A", text: "b", level: "basic", archived: false },
    { id: "s3", equipmentId: "e2", subgroup: "B", text: "c", level: "basic", archived: false },
    { id: "s4", equipmentId: "e3", subgroup: "C", text: "d", level: "basic", archived: false },
  ],
};

const meets = (skillId: string): MatrixEntry => ({ skillId, score: 3, notApplicable: false, expected: null });
const below = (skillId: string): MatrixEntry => ({ skillId, score: 0, notApplicable: false, expected: null });

function member(id: string, shift: string, equipments: string[], entries: MatrixEntry[]): TeamMemberInput {
  return { id, name: id, shift, teamId: null, equipments, entries, pdiOverdue: 0 };
}

describe("visão da equipe", () => {
  it("conta qualificado a partir de 80% de aderência, por turno", () => {
    const team = buildTeamMatrix(catalog, [
      member("a", "first", ["e1"], [meets("s1"), meets("s2")]),
      member("b", "second", ["e1"], [meets("s1"), below("s2")]),
      member("c", "first", ["e1", "e2"], [meets("s1"), meets("s2"), meets("s3")]),
    ]);
    const blister = team.equipments.find((item) => item.id === "e1");
    assert.equal(blister?.qualified, 2);
    assert.deepEqual(blister?.qualifiedByShift, { first: 2 });
    assert.equal(blister?.status, "ok");
  });

  it("deixa equipamento arquivado de fora e só mostra o que o técnico marcou", () => {
    const team = buildTeamMatrix(catalog, [member("a", "first", ["e1", "e3"], [meets("s1")])]);
    assert.deepEqual(team.equipments.map((item) => item.id), ["e1", "e2"]);
    assert.deepEqual(team.members[0]?.cells.map((cell) => cell.equipmentId), ["e1"]);
    assert.equal(team.members[0]?.cells[0]?.adherence, 50);
  });

  it("classifica a cobertura", () => {
    assert.equal(coverageStatus(0, 0), "none");
    assert.equal(coverageStatus(1, 2), "short");
    assert.equal(coverageStatus(1, 0), "single");
    assert.equal(coverageStatus(1, 1), "single");
    assert.equal(coverageStatus(2, 2), "ok");
    assert.equal(coverageStatus(3, 0), "ok");
  });
});
