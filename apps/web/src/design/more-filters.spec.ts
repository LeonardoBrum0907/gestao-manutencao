import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { moreFiltersLabel } from "./more-filters";

describe("botão \"Mais filtros\" das listas no celular", () => {
  it("sem filtro em uso, só o nome do botão", () => {
    assert.equal(moreFiltersLabel(0), "Mais filtros");
  });

  it("diz quantos filtros escondidos estão em uso", () => {
    assert.equal(moreFiltersLabel(1), "Mais filtros (1 em uso)");
    assert.equal(moreFiltersLabel(3), "Mais filtros (3 em uso)");
  });
});
