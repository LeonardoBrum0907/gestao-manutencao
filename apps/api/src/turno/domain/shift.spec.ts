import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { chamadoTask, nextDayNumber, noteOcorrencia, openChamado, type ChamadoInput } from "./shift";

const now = new Date("2026-10-01T18:00:00.000Z");
const opened = new Date("2026-10-01T12:00:00.000Z");
const closed = new Date("2026-10-01T13:30:00.000Z");

function chamado(partial: Partial<ChamadoInput> = {}): ChamadoInput {
  return {
    body: "Esteira parada",
    openedAt: opened,
    closedAt: closed,
    shift: "first",
    memberIds: ["a", "a", " b "],
    lineId: null,
    lineLabel: "Esteira 4",
    machineId: null,
    status: "in_progress",
    notes: "  ",
    ...partial,
  };
}

describe("chamado", () => {
  it("abre pela hora de abertura e calcula a duração", () => {
    const write = openChamado(chamado());
    assert.equal(write.body, "Esteira parada");
    assert.equal(write.durationMin, 90);
    assert.equal(write.occurredAt, opened);
    assert.equal(write.shift, "first");
    assert.deepEqual(write.memberIds, ["a", "b"]);
    assert.equal(write.lineLabel, "Esteira 4");
    assert.equal(write.notes, null);
    assert.equal(write.status, "in_progress");
  });

  it("sem fechamento fica sem duração", () => {
    assert.equal(openChamado(chamado({ closedAt: null })).durationMin, null);
  });

  it("recusa fechamento antes da abertura", () => {
    assert.throws(
      () => openChamado(chamado({ openedAt: closed, closedAt: opened })),
      (error: unknown) => error instanceof DomainError && error.code === "hours",
    );
  });

  it("recusa linha e outra juntas", () => {
    assert.throws(
      () => openChamado(chamado({ lineId: "maq", lineLabel: "outra" })),
      (error: unknown) => error instanceof DomainError && error.code === "line_conflict",
    );
  });

  it("recusa máquina sem linha", () => {
    assert.throws(
      () => openChamado(chamado({ machineId: "m1" })),
      (error: unknown) => error instanceof DomainError && error.code === "machine",
    );
  });

  it("numera o dia depois do maior número já usado", () => {
    assert.equal(nextDayNumber([]), 1);
    assert.equal(nextDayNumber([1, null, 4, 2]), 5);
  });

  it("a pendência gerada precisa de texto", () => {
    assert.throws(
      () => chamadoTask({ body: "  ", dueAt: now, memberId: null, priority: null }),
      (error: unknown) => error instanceof DomainError && error.code === "empty_body",
    );
  });
});

describe("ocorrência", () => {
  it("anota um problema de origem ocorrência", () => {
    const write = noteOcorrencia({ factoryId: "fab", line: " Linha A ", body: " Ruído " }, now);
    assert.equal(write.origin, "ocorrencia");
    assert.equal(write.status, "open");
    assert.equal(write.factoryId, "fab");
    assert.equal(write.line, "Linha A");
    assert.equal(write.body, "Ruído");
    assert.equal(write.dayNumber, null);
    assert.equal(write.occurredAt, now);
  });

  it("recusa linha vazia", () => {
    assert.throws(
      () => noteOcorrencia({ factoryId: "fab", line: "  ", body: "Ruído" }, now),
      (error: unknown) => error instanceof DomainError && error.code === "empty_body",
    );
  });
});
