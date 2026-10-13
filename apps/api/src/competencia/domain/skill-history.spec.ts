import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { changedSkills, nextStates, type SkillState } from "./skill-history";

const state = (skillId: string, score: number | null, notApplicable = false): SkillState => ({ skillId, score, notApplicable });

describe("changedSkills", () => {
  it("guarda nota nova e nota que mudou", () => {
    const result = changedSkills([state("s1", 2)], [state("s1", 3), state("s2", 1)]);
    assert.deepEqual(result, [state("s1", 3), state("s2", 1)]);
  });

  it("ignora nota igual à atual", () => {
    assert.deepEqual(changedSkills([state("s1", 2)], [state("s1", 2)]), []);
  });

  it("guarda a troca para N/A e a nota apagada", () => {
    const result = changedSkills([state("s1", 2), state("s2", 4)], [state("s1", null, true), state("s2", null)]);
    assert.deepEqual(result, [state("s1", null, true), state("s2", null)]);
  });

  it("apagar o que não tinha nota não entra", () => {
    assert.deepEqual(changedSkills([], [state("s1", null)]), []);
  });
});

describe("nextStates", () => {
  it("junta as salvas e as apagadas sem nota", () => {
    const saved = [{ skillId: "s1", score: 3, notApplicable: false, expected: 4 }];
    assert.deepEqual(nextStates(saved, ["s2"]), [state("s1", 3), state("s2", null)]);
  });
});
