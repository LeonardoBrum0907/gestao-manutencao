import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { demoModels, demoSkills } from "./demo-catalog";
import { DEMO_GRADE_EXPECTED, DEMO_MATRIX_PROFILES, demoAdherence, demoJitter, demoMatrixScores } from "./demo-matrix";
import { demoPeople, type DemoPerson } from "./demo-people";

const people = demoPeople().people;
const skills = demoSkills();
const personOf = (key: string): DemoPerson => {
  const person = people.find((item) => item.key === key);
  if (!person) throw new Error(`perfil da matriz para ${key}, que não está na equipe`);
  return person;
};
const categoryOf = (person: DemoPerson) => (person.role === "eletricista" ? "electrical" : "mechanical");

// Aderência que o perfil gera para cada modelo, como a Matriz da equipe calcula.
function adherences(): { member: string; model: string; adherence: number; shift: string }[] {
  return DEMO_MATRIX_PROFILES.flatMap((profile) => {
    const person = personOf(profile.member);
    const expected = DEMO_GRADE_EXPECTED[person.gradeIndex ?? 0];
    return Object.entries(profile.targets).map(([model, target]) => {
      const scores = demoMatrixScores({ skills, category: categoryOf(person), expected, target, strong: profile.strong, salt: `${profile.member}|${model}` });
      return { member: profile.member, model, adherence: demoAdherence(scores, skills, expected), shift: person.shift };
    });
  });
}

describe("cenário da matriz da demonstração", () => {
  it("dá um perfil a cada técnico, só com modelos que existem", () => {
    const technicians = people.filter((person) => person.role !== "Supervisor").map((person) => person.key);
    assert.deepEqual(DEMO_MATRIX_PROFILES.map((profile) => profile.member), technicians);
    const models = new Set(demoModels().map((model) => model.key));
    assert.ok(DEMO_MATRIX_PROFILES.every((profile) => Object.keys(profile.targets).every((model) => models.has(model))));
  });

  it("acerta a aderência-alvo de cada técnico em cada modelo", () => {
    const targets = DEMO_MATRIX_PROFILES.flatMap((profile) => Object.values(profile.targets));
    assert.deepEqual(adherences().map((row) => row.adherence), targets);
  });

  it("dá nota só na categoria da função, de 0 a 4, e referência nunca tem 0", () => {
    const scores = demoMatrixScores({ skills, category: "electrical", expected: DEMO_GRADE_EXPECTED[3], target: 88, strong: true, salt: "c8|a" });
    skills.forEach((skill, index) => assert.equal(scores.at(index) === null, skill.category !== "electrical", skill.text));
    const given = scores.filter((score): score is number => score !== null);
    assert.ok(given.every((score) => score >= 1 && score <= 4));
  });

  it("deixa o Equipamento C abaixo da meta e o 3º turno sem ninguém no A", () => {
    const qualified = adherences().filter((row) => row.adherence >= 60);
    const goal = demoModels().find((model) => model.key === "c")?.minQualified ?? 0;
    assert.ok(qualified.filter((row) => row.model === "c").length < goal);
    assert.equal(qualified.filter((row) => row.model === "a" && row.shift === "third").length, 0);
  });

  it("tira o mesmo número do mesmo texto", () => {
    assert.equal(demoJitter("c1|a"), demoJitter("c1|a"));
    assert.ok(demoJitter("c1|a") >= 0 && demoJitter("c1|a") < 1);
  });
});
