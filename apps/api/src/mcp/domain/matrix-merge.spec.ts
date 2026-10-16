import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MatrixCatalogDto, MatrixSkillDto } from "@manutencao/shared";
import { canonicalSubgroup, equipmentsToMark, findSameSkill, mergeScore } from "./matrix-merge";

const skill = (id: string, equipmentId: string, subgroup: string, text: string): MatrixSkillDto => ({
  id,
  equipmentId,
  subgroup,
  text,
  level: "basic",
  archived: false,
});

const catalog: MatrixCatalogDto = {
  equipments: [
    { id: "e1", name: "Envasadora", archived: false, minQualified: 0 },
    { id: "e2", name: "Rotuladora", archived: false, minQualified: 0 },
  ],
  skills: [skill("s1", "e1", "Cabeçote", "Trocar a faca"), skill("s2", "e2", "Cola", "Limpar o rolo"), skill("s3", "e2", "Cola", "Ajustar a temperatura")],
};

describe("nota pela IA", () => {
  const current = { skillId: "s1", score: 1 as const, notApplicable: false, expected: 3 as const };

  it("muda só a nota e mantém o esperado da linha", () => {
    assert.deepEqual(mergeScore(current, { skillId: "s1", score: 2 }), { skillId: "s1", score: 2, notApplicable: false, expected: 3 });
  });

  it("null limpa e ausente mantém", () => {
    assert.deepEqual(mergeScore(current, { skillId: "s1", expected: null }), { skillId: "s1", score: 1, notApplicable: false, expected: null });
  });

  it("não se aplica tira a nota, e nota nova tira o não se aplica", () => {
    assert.deepEqual(mergeScore(current, { skillId: "s1", notApplicable: true }), { skillId: "s1", score: null, notApplicable: true, expected: 3 });
    const na = { skillId: "s1", score: null, notApplicable: true, expected: null };
    assert.deepEqual(mergeScore(na, { skillId: "s1", score: 4 }), { skillId: "s1", score: 4, notApplicable: false, expected: null });
  });

  it("nota e não se aplica juntos seguem para o caso de uso recusar", () => {
    assert.deepEqual(mergeScore(undefined, { skillId: "s1", score: 2, notApplicable: true }), { skillId: "s1", score: 2, notApplicable: true, expected: null });
  });

  it("sem nota anterior começa vazia", () => {
    assert.deepEqual(mergeScore(undefined, { skillId: "s2", score: 0 }), { skillId: "s2", score: 0, notApplicable: false, expected: null });
  });
});

describe("equipamentos a marcar", () => {
  it("marca uma vez só o equipamento novo que ganhou nota ou não se aplica", () => {
    const entries = [
      { skillId: "s1", score: 3, notApplicable: false, expected: null },
      { skillId: "s2", score: null, notApplicable: true, expected: null },
      { skillId: "s3", score: 2, notApplicable: false, expected: null },
    ];
    assert.deepEqual(equipmentsToMark(["e1"], entries, catalog), ["e2"]);
  });

  it("nota limpa ou só esperado não marca nada", () => {
    const entries = [{ skillId: "s2", score: null, notApplicable: false, expected: 3 }];
    assert.deepEqual(equipmentsToMark([], entries, catalog), []);
  });
});

describe("habilidade repetida", () => {
  it("acha a mesma habilidade sem ligar para acento e caixa", () => {
    assert.equal(findSameSkill(catalog.skills, { equipmentId: "e1", subgroup: "cabecote", text: " TROCAR A FACA" })?.id, "s1");
    assert.equal(findSameSkill(catalog.skills, { equipmentId: "e2", subgroup: "Cabeçote", text: "Trocar a faca" }), undefined);
  });

  it("reaproveita a grafia do subconjunto que já existe no equipamento", () => {
    assert.equal(canonicalSubgroup(catalog.skills, "e1", "cabecote"), "Cabeçote");
    assert.equal(canonicalSubgroup(catalog.skills, "e2", "  Cabeçote "), "Cabeçote");
  });
});
