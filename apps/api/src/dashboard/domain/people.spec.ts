import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluationOf, lastClosedQuarter, silentMembers } from "./people";

describe("trimestre da avaliação", () => {
  it("em outubro olha o 3º trimestre", () => {
    assert.deepEqual(lastClosedQuarter(new Date("2026-10-12T12:00:00.000Z")), { year: 2026, quarter: 3 });
  });

  it("em janeiro olha o 4º do ano anterior, no fuso do gestor", () => {
    assert.deepEqual(lastClosedQuarter(new Date("2027-01-10T12:00:00.000Z")), { year: 2026, quarter: 4 });
    // 1º de abril 01h UTC ainda é 31 de março em São Paulo.
    assert.deepEqual(lastClosedQuarter(new Date("2026-04-01T01:00:00.000Z")), { year: 2025, quarter: 4 });
  });
});

describe("avaliação do trimestre", () => {
  it("conta quem falta e quem ficou abaixo da meta pela média", () => {
    const scores = [
      { memberId: "a", score: 10 },
      { memberId: "a", score: 6 },
      { memberId: "b", score: 6 },
      { memberId: "b", score: 8 },
      { memberId: "fora", score: 2 },
    ];
    assert.deepEqual(evaluationOf({ year: 2026, quarter: 3 }, ["a", "b", "c"], scores, 8), {
      year: 2026,
      quarter: 3,
      technicians: 3,
      missing: 1,
      belowTarget: 1,
      target: 8,
    });
  });
});

describe("sem feedback", () => {
  const now = new Date("2026-10-12T12:00:00.000Z");
  const members = [
    { id: "b", name: "Bruno" },
    { id: "a", name: "Ana" },
    { id: "c", name: "Carla" },
  ];

  it("lista quem nunca recebeu ou recebeu há mais de 60 dias", () => {
    const last = new Map([
      ["b", new Date("2026-07-01T12:00:00.000Z")],
      ["c", new Date("2026-10-01T12:00:00.000Z")],
    ]);
    assert.deepEqual(silentMembers(members, last, now, 60).map((member) => member.name), ["Ana", "Bruno"]);
  });
});
