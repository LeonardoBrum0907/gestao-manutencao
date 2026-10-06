import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RpFields } from "@manutencao/shared";
import { mirrorProblem, normalizeOrder, normalizeProblem, problemStatus } from "./rp";

function fields(partial: Partial<RpFields> = {}): RpFields {
  return {
    occurredAt: "2026-10-04T12:00:00.000Z",
    orderNumber: null,
    factoryId: "f1",
    machineId: null,
    line: "Cam 08",
    tag: "EBS-BLI-31",
    problem: "Alarme na esteira",
    description: null,
    repeatedFailure: false,
    repeatedTimes: null,
    repeatedPeriod: null,
    causes: {
      material: { marked: false, text: null },
      machine: { marked: false, text: null },
      method: { marked: false, text: null },
      labor: { marked: false, text: null },
    },
    rootCause: null,
    corrective: null,
    preventive: null,
    status: "analysis",
    basicConditionImpact: null,
    memberIds: ["a"],
    unmatchedTechnicians: null,
    ...partial,
  };
}

describe("problema espelho do RP", () => {
  it("mapeia o status do RP para o do Problema", () => {
    assert.equal(problemStatus("analysis"), "open");
    assert.equal(problemStatus("monitoring"), "in_progress");
    assert.equal(problemStatus("corrected"), "done");
    assert.equal(problemStatus("producing"), "done");
  });

  it("sem máquina cadastrada guarda linha e TAG como rótulo", () => {
    const write = mirrorProblem(fields(), new Date("2026-10-04T12:00:00.000Z"));
    assert.equal(write.origin, "rp");
    assert.equal(write.body, "Alarme na esteira");
    assert.equal(write.machineId, null);
    assert.equal(write.machineLabel, "Cam 08 · EBS-BLI-31");
    assert.deepEqual(write.memberIds, ["a"]);
  });

  it("com máquina cadastrada não repete o rótulo", () => {
    const write = mirrorProblem(fields({ machineId: "m1", status: "corrected" }), new Date());
    assert.equal(write.machineId, "m1");
    assert.equal(write.machineLabel, null);
    assert.equal(write.status, "done");
  });
});

describe("chaves de duplicidade", () => {
  it("normaliza a ordem sem espaços, pontos nem caixa", () => {
    assert.equal(normalizeOrder(" 123.456 AB "), "123456ab");
    assert.equal(normalizeOrder("  "), null);
    assert.equal(normalizeOrder(null), null);
  });

  it("normaliza o problema sem acento, pontuação nem espaços repetidos", () => {
    assert.equal(normalizeProblem("  Alarme  de Posição, na esteira. "), "alarme de posicao na esteira");
  });
});
