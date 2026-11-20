import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BEHAVIOR_RATINGS, PERFORMANCE_SCORES, PRODUCTIVITY_LEVELS } from "@manutencao/shared";
import { demoSkills } from "./demo-catalog";
import { DEMO_PDIS, demoBehavior, demoPerformanceScore, demoQuarters } from "./demo-development";
import { demoPeople } from "./demo-people";
import { demoRandom } from "./demo-random";

describe("desenvolvimento da demonstração", () => {
  it("sorteia avaliação e comportamento só com valores do sistema", () => {
    const random = demoRandom(9);
    for (let grade = 0; grade < 4; grade++) assert.ok(PERFORMANCE_SCORES.includes(demoPerformanceScore(random, grade)));
    const behavior = demoBehavior(random);
    assert.ok(BEHAVIOR_RATINGS.includes(behavior.punctuality) && BEHAVIOR_RATINGS.includes(behavior.collaboration));
    assert.ok(PRODUCTIVITY_LEVELS.includes(behavior.productivity));
  });

  it("conta os trimestres do ano até o atual", () => {
    assert.deepEqual(demoQuarters(new Date("2026-02-10T12:00:00Z")), [1]);
    assert.deepEqual(demoQuarters(new Date("2026-10-22T12:00:00Z")), [1, 2, 3, 4]);
  });

  it("aponta o PDI para pessoas e habilidades que existem", () => {
    const keys = new Set(demoPeople().people.map((person) => person.key));
    const skillCount = demoSkills().length;
    for (const pdi of DEMO_PDIS) {
      assert.ok(keys.has(pdi.member));
      for (const item of pdi.items) {
        if (item.responsible) assert.ok(keys.has(item.responsible), item.title);
        if (item.skill) assert.ok(item.skill.index < skillCount, item.title);
      }
    }
  });
});
