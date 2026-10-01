import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProblemWrite } from "../../ports/problem-log";
import { problemFromShift } from "./shift-problem";

const when = new Date("2026-10-01T15:00:00.000Z");

function chamado(): ProblemWrite {
  return {
    origin: "chamado",
    body: "Parou a esteira",
    occurredAt: when,
    status: "open",
    technicianIds: ["t1", "t2"],
    factoryId: null,
    machineId: "maq",
    machineLabel: null,
    line: null,
    notes: "Aguardando peça",
    dayNumber: 4,
    openedAt: when,
    closedAt: null,
    durationMin: null,
  };
}

describe("turno vira problema", () => {
  it("chamado persiste como problema de origem chamado", () => {
    const state = problemFromShift(chamado());
    assert.equal(state.type, "problem");
    assert.equal(state.origin, "chamado");
    assert.equal(state.dayNumber, 4);
    assert.deepEqual(state.technicianIds, ["t1", "t2"]);
    assert.equal(state.priority, null);
    assert.equal(state.dueAt, null);
  });

  it("ocorrência persiste como problema com fábrica e linha", () => {
    const state = problemFromShift({
      ...chamado(),
      origin: "ocorrencia",
      body: "Folga no rolamento",
      status: "open",
      technicianIds: [],
      factoryId: "fab",
      machineId: null,
      line: "Linha 2",
      notes: null,
      dayNumber: null,
      openedAt: null,
      closedAt: null,
      durationMin: null,
    });
    assert.equal(state.type, "problem");
    assert.equal(state.origin, "ocorrencia");
    assert.equal(state.factoryId, "fab");
    assert.equal(state.line, "Linha 2");
    assert.equal(state.dayNumber, null);
  });
});
