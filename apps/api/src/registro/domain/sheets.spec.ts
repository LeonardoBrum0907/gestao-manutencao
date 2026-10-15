import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { captureRecord } from "./capture";
import { applyEntrySheet, applyFeedbackSheet, applyProblemSheet, applyTaskSheet } from "./sheets";

const when = new Date("2026-09-30T12:00:00.000Z");

describe("ficha", () => {
  it("problema recusa linha e outra ao mesmo tempo", () => {
    const problem = captureRecord({
      type: "problem",
      body: "Vazamento",
      occurredAt: when,
      memberId: null,
      tone: null,
    });
    assert.throws(
      () =>
        applyProblemSheet(problem, {
          body: "Vazamento",
          occurredAt: when,
          memberId: null,
          lineId: "maq",
          lineLabel: "outra linha",
          machineId: null,
          subassemblyId: null,
          notes: null,
        }),
      (error: unknown) => error instanceof DomainError && error.code === "line_conflict",
    );
  });

  it("problema guarda máquina e subconjunto da ficha", () => {
    const problem = captureRecord({ type: "problem", body: "Vazamento", occurredAt: when, memberId: null, tone: null });
    const next = applyProblemSheet(problem, {
      body: "Vazamento no cilindro",
      occurredAt: when,
      memberId: null,
      lineId: "med-03",
      lineLabel: null,
      machineId: "encartuchadeira",
      subassemblyId: "valvulas",
      notes: null,
    });
    assert.equal(next.machineId, "encartuchadeira");
    assert.equal(next.subassemblyId, "valvulas");
  });

  it("tarefa guarda prazo e prioridade sem anexo na captura", () => {
    const task = captureRecord({
      type: "task",
      body: "Lubrificar",
      occurredAt: when,
      memberId: null,
      tone: null,
    });
    const due = new Date("2026-10-02T15:00:00.000Z");
    const next = applyTaskSheet(task, {
      body: "Lubrificar",
      occurredAt: when,
      status: "in_progress",
      memberId: "tec",
      factoryId: "fab",
      tag: "TAG-1",
      line: "Linha A",
      priority: "high",
      dueAt: due,
      dueHasTime: true,
      notes: "Peça a caminho",
    });
    assert.equal(next.priority, "high");
    assert.equal(next.dueAt, due);
    assert.equal(next.dueHasTime, true);
    assert.equal(next.status, "in_progress");
    assert.equal(next.tag, "TAG-1");
  });

  it("sem prazo, o horário do prazo some junto", () => {
    const task = captureRecord({ type: "task", body: "Lubrificar", occurredAt: when, memberId: null, tone: null });
    const next = applyTaskSheet(task, {
      body: "Lubrificar",
      occurredAt: when,
      status: "open",
      memberId: null,
      factoryId: null,
      tag: null,
      line: null,
      priority: null,
      dueAt: null,
      dueHasTime: true,
      notes: null,
    });
    assert.equal(next.dueHasTime, false);
  });

  it("feedback guarda a observação", () => {
    const feedback = captureRecord({ type: "feedback", body: "Elogiar", occurredAt: when, memberId: "tec", tone: "positive" });
    const next = applyFeedbackSheet(feedback, { body: "Elogiar", occurredAt: when, memberId: "tec", tone: "positive", notes: "na reunião de segunda" });
    assert.equal(next.notes, "na reunião de segunda");
  });

  it("rascunho da Entrada guarda texto e descrição e nada mais", () => {
    const entry = { ...captureRecord({ type: "entry", body: "Ver vazamento", occurredAt: when, memberId: null, tone: null }), priority: "high" as const };
    const next = applyEntrySheet(entry, { body: "Ver vazamento na MED 03", occurredAt: when, notes: "perto da esteira" });
    assert.equal(next.body, "Ver vazamento na MED 03");
    assert.equal(next.notes, "perto da esteira");
    assert.equal(next.priority, null);
  });
});
