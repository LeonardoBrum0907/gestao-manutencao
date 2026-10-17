import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MatrixCatalogDto } from "./competency-matrix";
import { catalogForCategory, competencyMatrixTitle, isMatrixCategory, skillFitsCategory } from "./matrix-category";

const skill = (id: string, category: "mechanical" | "electrical") => ({
  id,
  equipmentId: "e1",
  subgroup: "Selagem",
  text: id,
  level: "basic" as const,
  category,
  archived: false,
});

const catalog: MatrixCatalogDto = {
  equipments: [{ id: "e1", name: "Blistadeira", archived: false, minQualified: 0 }],
  skills: [skill("s1", "mechanical"), skill("s2", "electrical")],
};

describe("categoria da matriz", () => {
  it("aceita só mecânico e eletricista", () => {
    assert.equal(isMatrixCategory("mechanical"), true);
    assert.equal(isMatrixCategory("electrical"), true);
    assert.equal(isMatrixCategory("technician"), false);
    assert.equal(isMatrixCategory(null), false);
  });

  it("sem categoria a pessoa vê as duas", () => {
    assert.equal(skillFitsCategory({ category: "electrical" }, null), true);
    assert.equal(skillFitsCategory({ category: "electrical" }, "mechanical"), false);
  });

  it("filtra as habilidades e mantém os equipamentos", () => {
    const electrical = catalogForCategory(catalog, "electrical");
    assert.deepEqual(electrical.skills.map((item) => item.id), ["s2"]);
    assert.equal(electrical.equipments.length, 1);
    assert.equal(catalogForCategory(catalog, null), catalog);
  });

  it("título do check list pela categoria", () => {
    assert.equal(competencyMatrixTitle("mechanical"), "Check List de Conhecimento Específico Mecânico por Equipamento");
    assert.equal(competencyMatrixTitle("electrical"), "Check List de Conhecimento Específico Eletricista por Equipamento");
    assert.equal(competencyMatrixTitle(null), "Check List de Conhecimento Específico Mecânico e Eletricista por Equipamento");
  });
});
