import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCompletedDay, formatDay } from "./pdi-items";

describe("formatDay", () => {
  it("mostra o dia do banco (AAAA-MM-DD) como DD/MM/AAAA", () => {
    assert.equal(formatDay("2026-10-10"), "10/10/2026");
  });

  it("mostra travessão quando não há dia", () => {
    assert.equal(formatDay(null), "—");
    assert.equal(formatDay(""), "—");
  });
});

// Regressão: o dia vinha do horário em UTC (completedAt.slice(0, 10)); concluído depois das 21h saía no dia seguinte.
describe("dia em que o item foi concluído", () => {
  it("usa o dia de Brasília, não o de UTC", () => {
    assert.equal(formatCompletedDay("2026-10-20T01:30:00.000Z"), "19/10/2026");
  });

  it("de dia, o mesmo dia", () => {
    assert.equal(formatCompletedDay("2026-10-20T18:11:57.631Z"), "20/10/2026");
  });
});
