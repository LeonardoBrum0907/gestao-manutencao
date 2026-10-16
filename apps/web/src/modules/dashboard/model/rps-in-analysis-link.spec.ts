import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rpsInAnalysisLink } from "./rps-in-analysis-link";

describe("link das RPs em análise no Dashboard", () => {
  it("com fábrica escolhida, abre a lista filtrada nessa fábrica", () => {
    assert.equal(rpsInAnalysisLink("fab_2"), "/rp?status=analysis&factoryId=fab_2");
  });

  it("em todas as fábricas, abre só o filtro de status", () => {
    assert.equal(rpsInAnalysisLink(null), "/rp?status=analysis");
    assert.equal(rpsInAnalysisLink(""), "/rp?status=analysis");
  });
});
