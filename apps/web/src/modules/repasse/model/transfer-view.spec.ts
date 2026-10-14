import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TransferGapDto } from "@manutencao/shared";
import { daysAgoLabel, filterGaps, firstName, shortName, progressLabel, shortDate, transferGroup } from "./transfer-view";

const gap = (skillId: string, learnerScore: number | null): TransferGapDto => ({
  skillId,
  equipmentName: "Blistadeira",
  subgroup: "A",
  text: skillId,
  learnerScore,
  teacherScore: 4,
  openPdiItemId: null,
});

describe("daysAgoLabel", () => {
  const now = new Date("2026-10-12T15:00:00Z");

  it("conta dias de Brasília", () => {
    assert.equal(daysAgoLabel("2026-10-12T04:00:00Z", now), "hoje");
    assert.equal(daysAgoLabel("2026-10-12T01:00:00Z", now), "ontem");
    assert.equal(daysAgoLabel("2026-10-02T12:00:00Z", now), "há 10 dias");
  });
});

describe("shortDate", () => {
  it("dia/mês/ano no fuso do gestor", () => assert.equal(shortDate("2026-10-13T01:00:00Z"), "12/10/2026"));
});

describe("progressLabel e shortName", () => {
  it("formatam", () => {
    assert.equal(progressLabel({ done: 26, mastered: 46 }), "26 de 46");
    assert.equal(shortName("  Renato Crispin Vitorino "), "Renato Crispin");
    assert.equal(shortName("Severino"), "Severino");
    assert.equal(firstName("Renato Crispin"), "Renato");
  });
});

describe("transferGroup", () => {
  it("agrupa pela equipe de quem aprende", () => {
    assert.deepEqual(transferGroup({ learner: { teamName: "Preventiva" } }), { key: "Preventiva", title: "Preventiva" });
    assert.deepEqual(transferGroup({ learner: { teamName: null } }), { key: "", title: "Sem equipe" });
  });
});

describe("filterGaps", () => {
  const gaps = [gap("s1", 2), gap("s2", 1), gap("s3", null)];

  it("separa perto (nota 2) e do zero", () => {
    assert.deepEqual(filterGaps(gaps, "near").map((item) => item.skillId), ["s1"]);
    assert.deepEqual(filterGaps(gaps, "zero").map((item) => item.skillId), ["s2", "s3"]);
    assert.equal(filterGaps(gaps, "all").length, 3);
  });
});
