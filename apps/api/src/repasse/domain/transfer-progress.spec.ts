import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MatrixCatalogDto } from "@manutencao/shared";
import { byEquipment, doesSkill, gapsOf, masteredSkills, percentOf, progressOf, type ScoreState } from "./transfer-progress";

const catalog: MatrixCatalogDto = {
  equipments: [
    { id: "e1", name: "Blistadeira", archived: false, minQualified: 0 },
    { id: "e2", name: "Encartuchadeira", archived: false, minQualified: 0 },
    { id: "e3", name: "Antiga", archived: true, minQualified: 0 },
  ],
  skills: [
    { id: "s1", equipmentId: "e1", subgroup: "Formação", text: "Trocar formato", level: "basic", archived: false },
    { id: "s2", equipmentId: "e1", subgroup: "Formação", text: "Ajustar selagem", level: "advanced", archived: false },
    { id: "s3", equipmentId: "e2", subgroup: "Cartucho", text: "Ajustar magazine", level: "basic", archived: false },
    { id: "s4", equipmentId: "e2", subgroup: "Cartucho", text: "Antiga habilidade", level: "basic", archived: true },
    { id: "s5", equipmentId: "e3", subgroup: "X", text: "Equipamento arquivado", level: "basic", archived: false },
    { id: "s6", equipmentId: "e2", subgroup: "Cartucho", text: "Trocar correia", level: "basic", archived: false },
  ],
};

const scored = (score: number | null, notApplicable = false): ScoreState => ({ score, notApplicable });
const book = (entries: Record<string, ScoreState>) => new Map(Object.entries(entries));

const teacher = book({ s1: scored(4), s2: scored(3), s3: scored(3), s4: scored(4), s5: scored(4), s6: scored(2) });

describe("doesSkill", () => {
  it("nota 3 ou 4 faz; 2, N/A ou sem nota não", () => {
    assert.equal(doesSkill(scored(3)), true);
    assert.equal(doesSkill(scored(4)), true);
    assert.equal(doesSkill(scored(2)), false);
    assert.equal(doesSkill(scored(4, true)), false);
    assert.equal(doesSkill(undefined), false);
  });
});

describe("masteredSkills", () => {
  it("só habilidades ativas, de equipamentos ativos em foco, com nota 3+ de quem ensina", () => {
    const ids = masteredSkills(catalog, ["e1", "e2", "e3"], teacher).map((skill) => skill.id);
    assert.deepEqual(ids, ["s1", "s2", "s3"]);
  });

  it("respeita o foco", () => {
    assert.deepEqual(masteredSkills(catalog, ["e2"], teacher).map((skill) => skill.id), ["s3"]);
  });
});

describe("progressOf", () => {
  const mastered = masteredSkills(catalog, ["e1", "e2"], teacher);

  it("separa feitas, perto (nota 2) e do zero", () => {
    const learner = book({ s1: scored(3), s2: scored(2), s3: scored(1) });
    assert.deepEqual(progressOf(mastered, learner), { mastered: 3, done: 1, near: 1, fromZero: 1, percent: 33 });
  });

  it("N/A de quem aprende conta como do zero", () => {
    const learner = book({ s1: scored(2, true) });
    assert.equal(progressOf(mastered, learner).fromZero, 3);
  });

  it("percentual nulo quando quem ensina não domina nada", () => {
    assert.equal(progressOf([], book({})).percent, null);
  });
});

describe("percentOf", () => {
  it("arredonda", () => assert.equal(percentOf(26, 46), 57));
});

describe("byEquipment", () => {
  it("conta por equipamento e esconde os sem nada a repassar", () => {
    const mastered = masteredSkills(catalog, ["e1", "e2"], teacher);
    const rows = byEquipment(catalog, mastered, book({ s1: scored(4) }));
    assert.deepEqual(rows, [
      { equipmentId: "e1", name: "Blistadeira", mastered: 2, done: 1 },
      { equipmentId: "e2", name: "Encartuchadeira", mastered: 1, done: 0 },
    ]);
  });
});

describe("gapsOf", () => {
  it("lista o que falta com as notas e o item de PDI aberto", () => {
    const mastered = masteredSkills(catalog, ["e1", "e2"], teacher);
    const learner = book({ s1: scored(3), s2: scored(2), s3: scored(1, true) });
    const gaps = gapsOf(catalog, mastered, { teacher, learner, openPdiBySkill: new Map([["s2", "pdi1"]]) });
    assert.deepEqual(gaps, [
      { skillId: "s2", equipmentName: "Blistadeira", subgroup: "Formação", text: "Ajustar selagem", learnerScore: 2, teacherScore: 3, openPdiItemId: "pdi1" },
      { skillId: "s3", equipmentName: "Encartuchadeira", subgroup: "Cartucho", text: "Ajustar magazine", learnerScore: null, teacherScore: 3, openPdiItemId: null },
    ]);
  });
});
