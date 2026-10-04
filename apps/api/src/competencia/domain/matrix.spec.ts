import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MatrixCatalogDto, MatrixSkillDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import {
  assertMatrixEditable,
  buildMatrix,
  normalizeEntry,
  requireEquipments,
  requireSkill,
  summarize,
  type MatrixEntry,
} from "./matrix";

function skill(id: string, equipmentId: string, level: MatrixSkillDto["level"], archived = false): MatrixSkillDto {
  return { id, equipmentId, subgroup: "Selagem", text: id, level, archived };
}

const skills: MatrixSkillDto[] = [
  skill("A", "blistadeira-cam", "basic"),
  skill("B", "blistadeira-cam", "intermediate"),
  skill("C", "blistadeira-cam", "advanced"),
  skill("D", "blistadeira-cam", "advanced"),
];

const catalog: MatrixCatalogDto = {
  equipments: [
    { id: "blistadeira-cam", name: "Blistadeira CAM", archived: false },
    { id: "encaixotadora-cam", name: "Encaixotadora CAM", archived: false },
    { id: "prensa-antiga", name: "Prensa antiga", archived: true },
  ],
  skills: [
    ...skills,
    skill("E1", "encaixotadora-cam", "basic"),
    skill("E2", "encaixotadora-cam", "basic"),
    skill("E3", "encaixotadora-cam", "basic", true),
    skill("P1", "prensa-antiga", "basic"),
  ],
};

function entry(skillId: string, partial: Partial<MatrixEntry>): MatrixEntry {
  return { skillId, score: null, notApplicable: false, expected: null, ...partial };
}

describe("resumo da matriz", () => {
  it("compara a nota com o esperado do nível", () => {
    const entries = new Map([
      ["A", entry("A", { score: 2 })],
      ["B", entry("B", { score: 2 })],
      ["C", entry("C", { score: 4 })],
    ]);
    const summary = summarize(skills, entries);
    assert.equal(summary.applicable, 4);
    assert.equal(summary.scored, 3);
    assert.equal(summary.meets, 2);
    assert.equal(summary.below, 1);
    assert.equal(summary.unscored, 1);
    assert.equal(summary.average, 2.7);
    assert.equal(summary.adherence, 50);
  });

  it("tira o “não se aplica” da conta", () => {
    const entries = new Map([
      ["A", entry("A", { score: 3 })],
      ["D", entry("D", { notApplicable: true })],
    ]);
    const summary = summarize(skills, entries);
    assert.equal(summary.notApplicable, 1);
    assert.equal(summary.applicable, 3);
    assert.equal(summary.adherence, 33);
  });

  it("usa o esperado ajustado no técnico", () => {
    const entries = new Map([["C", entry("C", { score: 3, expected: 3 })]]);
    assert.equal(summarize(skills, entries).meets, 1);
  });

  it("sem habilidade aplicável não tem aderência", () => {
    const entries = new Map(skills.map((skill) => [skill.id, entry(skill.id, { notApplicable: true })]));
    const summary = summarize(skills, entries);
    assert.equal(summary.adherence, null);
    assert.equal(summary.average, null);
  });
});

describe("matriz do técnico", () => {
  it("conta só os equipamentos que se aplicam a ele e só as habilidades ativas", () => {
    const entries = ["E1", "E2", "E3"].map((id) => entry(id, { score: 4 }));
    const matrix = buildMatrix(catalog, ["encaixotadora-cam"], entries);
    assert.equal(matrix.summary.applicable, 2);
    assert.equal(matrix.summary.adherence, 100);
    assert.deepEqual(matrix.byEquipment.map((item) => item.equipment), ["encaixotadora-cam"]);
  });

  it("guarda a nota de equipamento desmarcado sem contar", () => {
    const matrix = buildMatrix(catalog, [], [entry("A", { score: 4 })]);
    assert.equal(matrix.summary.applicable, 0);
    assert.equal(matrix.summary.adherence, null);
  });

  it("devolve os equipamentos na ordem do cadastro, sem os arquivados", () => {
    assert.deepEqual(buildMatrix(catalog, ["encaixotadora-cam", "prensa-antiga", "blistadeira-cam"], []).equipments, [
      "blistadeira-cam",
      "encaixotadora-cam",
    ]);
  });

  it("aceita só equipamento ativo e mantém o arquivado que já estava marcado", () => {
    assert.deepEqual(requireEquipments(["encaixotadora-cam", "blistadeira-cam", "blistadeira-cam"], catalog, []), [
      "blistadeira-cam",
      "encaixotadora-cam",
    ]);
    assert.deepEqual(requireEquipments(["encaixotadora-cam"], catalog, ["prensa-antiga", "blistadeira-cam"]), [
      "encaixotadora-cam",
      "prensa-antiga",
    ]);
    for (const values of [["prensa"], ["prensa-antiga"], "blistadeira-cam"]) {
      assert.throws(() => requireEquipments(values, catalog, []), (error: unknown) => error instanceof DomainError && error.statusCode === 400);
    }
  });

  it("não aceita nota em habilidade arquivada nem de equipamento arquivado", () => {
    assert.equal(requireSkill("E1", catalog).id, "E1");
    for (const id of ["E3", "P1"]) {
      assert.throws(() => requireSkill(id, catalog), (error: unknown) => error instanceof DomainError && error.code === "skill_archived");
    }
    assert.throws(() => requireSkill("X", catalog), (error: unknown) => error instanceof DomainError && error.statusCode === 404);
  });
});

describe("nota da habilidade", () => {
  it("recusa nota fora de 0 a 4 e esperado 0", () => {
    assert.throws(() => normalizeEntry("A", { score: 5, notApplicable: false, expected: null }), DomainError);
    assert.throws(() => normalizeEntry("A", { score: 2, notApplicable: false, expected: 0 }), DomainError);
  });

  it("recusa nota junto com “não se aplica”", () => {
    assert.throws(() => normalizeEntry("A", { score: 0, notApplicable: true, expected: null }), DomainError);
  });

  it("nota zero é “não apto”, não vazio", () => {
    assert.deepEqual(normalizeEntry("A", { score: 0, notApplicable: false, expected: null }), entry("A", { score: 0 }));
  });

  it("entrada vazia apaga a linha", () => {
    assert.equal(normalizeEntry("A", { score: null, notApplicable: false, expected: null }), null);
  });
});

describe("quem tem matriz", () => {
  it("só técnico tem a matriz editada", () => {
    assert.doesNotThrow(() => assertMatrixEditable("technician"));
    assert.throws(() => assertMatrixEditable("supervisor"), (error: unknown) => {
      assert.ok(error instanceof DomainError);
      assert.equal(error.code, "matrix_technician_only");
      assert.equal(error.statusCode, 409);
      return true;
    });
  });
});
