import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, countByWeek, periodRange, weekOf, weekStarts } from "./period";

// 12/10/2026 é segunda-feira; 15h UTC = 12h em São Paulo.
const now = new Date("2026-10-12T15:00:00.000Z");

describe("período do dashboard", () => {
  it("soma e subtrai dias atravessando o mês", () => {
    assert.equal(addDays("2026-10-01", -1), "2026-09-30");
    assert.equal(addDays("2026-10-12", 7), "2026-10-19");
  });

  it("últimos 7 dias começam à meia-noite de São Paulo de 6 dias atrás", () => {
    const range = periodRange(7, now);
    assert.equal(range.from.toISOString(), "2026-10-06T03:00:00.000Z");
    assert.equal(range.previousFrom.toISOString(), "2026-09-29T03:00:00.000Z");
    assert.equal(range.to, now);
  });

  it("semana começa na segunda, no fuso do gestor", () => {
    assert.equal(weekOf(now), "2026-10-12");
    assert.equal(weekOf(new Date("2026-10-18T23:00:00.000Z")), "2026-10-12");
    // Segunda 01h UTC ainda é domingo em São Paulo.
    assert.equal(weekOf(new Date("2026-10-12T01:00:00.000Z")), "2026-10-05");
  });

  it("lista as semanas da mais antiga para a atual", () => {
    assert.deepEqual(weekStarts(now, 3), ["2026-09-28", "2026-10-05", "2026-10-12"]);
  });

  it("conta por semana e ignora o que cai fora", () => {
    const counts = countByWeek(
      [new Date("2026-10-13T12:00:00.000Z"), new Date("2026-10-06T12:00:00.000Z"), new Date("2026-08-01T12:00:00.000Z")],
      ["2026-10-05", "2026-10-12"],
    );
    assert.deepEqual([...counts.entries()], [["2026-10-05", 1], ["2026-10-12", 1]]);
  });
});
