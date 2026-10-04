import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { noteOcorrencia, openChamado, type ChamadoInput } from "./shift";

const now = new Date("2026-10-01T18:00:00.000Z");
const opened = new Date("2026-10-01T12:00:00.000Z");
const closed = new Date("2026-10-01T13:30:00.000Z");

function chamado(partial: Partial<ChamadoInput> = {}): ChamadoInput {
  return {
    dayNumber: 3,
    body: "Esteira parada",
    openedAt: opened,
    closedAt: closed,
    durationMin: null,
    memberIds: ["a", "a", " b "],
    machineId: null,
    machineLabel: "Esteira 4",
    status: "in_progress",
    notes: "  ",
    ...partial,
  };
}

describe("chamado", () => {
  it("abre um problema de origem chamado e calcula a duração", () => {
    const write = openChamado(chamado(), now);
    assert.equal(write.origin, "chamado");
    assert.equal(write.body, "Esteira parada");
    assert.equal(write.dayNumber, 3);
    assert.equal(write.durationMin, 90);
    assert.equal(write.occurredAt, opened);
    assert.deepEqual(write.memberIds, ["a", "b"]);
    assert.equal(write.machineLabel, "Esteira 4");
    assert.equal(write.notes, null);
    assert.equal(write.status, "in_progress");
  });

  it("guarda a duração informada", () => {
    const write = openChamado(chamado({ durationMin: 40 }), now);
    assert.equal(write.durationMin, 40);
  });

  it("recusa fechamento antes da abertura", () => {
    assert.throws(
      () => openChamado(chamado({ openedAt: closed, closedAt: opened }), now),
      (error: unknown) => error instanceof DomainError && error.code === "hours",
    );
  });

  it("recusa máquina e outra juntas", () => {
    assert.throws(
      () => openChamado(chamado({ machineId: "maq", machineLabel: "outra" }), now),
      (error: unknown) => error instanceof DomainError && error.code === "machine_conflict",
    );
  });

  it("recusa número do dia vazio", () => {
    assert.throws(
      () => openChamado(chamado({ dayNumber: 0 }), now),
      (error: unknown) => error instanceof DomainError && error.code === "day_number",
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
