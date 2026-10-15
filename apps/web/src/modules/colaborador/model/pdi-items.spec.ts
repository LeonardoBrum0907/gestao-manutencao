import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDay } from "./pdi-items";

describe("formatDay", () => {
  it("mostra o dia do banco (AAAA-MM-DD) como DD/MM/AAAA", () => {
    assert.equal(formatDay("2026-10-10"), "10/10/2026");
  });

  it("mostra travessão quando não há dia", () => {
    assert.equal(formatDay(null), "—");
    assert.equal(formatDay(""), "—");
  });
});
