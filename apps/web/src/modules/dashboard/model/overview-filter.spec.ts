import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { overviewApiQuery, readOverviewFilter, writeOverviewFilter } from "./overview-filter";

describe("filtros do Dashboard no endereço", () => {
  it("sem nada fica em 30 dias e todas as fábricas", () => {
    assert.deepEqual(readOverviewFilter(new URLSearchParams()), { days: 30, factoryId: "" });
  });

  it("período fora da lista volta ao padrão", () => {
    assert.equal(readOverviewFilter(new URLSearchParams("dias=15")).days, 30);
    assert.equal(readOverviewFilter(new URLSearchParams("dias=90")).days, 90);
  });

  it("grava só o que difere do padrão", () => {
    assert.equal(writeOverviewFilter({ days: 30, factoryId: "" }).toString(), "");
    assert.equal(writeOverviewFilter({ days: 7, factoryId: "f2" }).toString(), "dias=7&fabrica=f2");
  });

  it("a chamada à API leva sempre o período", () => {
    assert.equal(overviewApiQuery({ days: 30, factoryId: "" }), "dias=30");
    assert.equal(overviewApiQuery({ days: 90, factoryId: "f3" }), "dias=90&fabrica=f3");
  });
});
