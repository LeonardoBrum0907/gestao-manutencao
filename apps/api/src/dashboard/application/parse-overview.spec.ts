import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseOverviewQuery } from "./parse-overview";

describe("filtros do dashboard", () => {
  it("sem nada usa 30 dias e todas as fábricas", () => {
    assert.deepEqual(parseOverviewQuery({}), { days: 30, factoryId: null });
  });

  it("lê período e fábrica", () => {
    assert.deepEqual(parseOverviewQuery({ dias: "7", fabrica: " fab_2 " }), { days: 7, factoryId: "fab_2" });
  });

  it("recusa período fora da lista, dizendo o que recebeu", () => {
    assert.throws(() => parseOverviewQuery({ dias: "15" }), /"15" inválido\. Use 7, 30, 90 dias/);
  });
});
