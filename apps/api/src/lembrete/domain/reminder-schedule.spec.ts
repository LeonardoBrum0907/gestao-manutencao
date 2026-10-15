import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dueFireAt, effectiveFireAt, type ReminderCandidate } from "./reminder-schedule";

const hourBefore: ReminderCandidate = {
  id: "r1",
  kind: "before",
  at: null,
  minutesBefore: 60,
  snoozedUntil: null,
  sentFor: null,
  createdAt: new Date("2026-10-15T12:00:00.000Z"),
  task: { id: "t1", body: "Trocar correia", dueAt: new Date("2026-10-15T17:30:00.000Z"), dueHasTime: true },
};
const fireAt = new Date("2026-10-15T16:30:00.000Z");

describe("lembrete: relógio", () => {
  it("toca quando chega a hora, uma vez só", () => {
    assert.equal(dueFireAt(hourBefore, new Date("2026-10-15T16:29:00.000Z")), null);
    assert.equal(dueFireAt(hourBefore, new Date("2026-10-15T16:30:30.000Z"))?.toISOString(), fireAt.toISOString());
    assert.equal(dueFireAt({ ...hourBefore, sentFor: fireAt }, new Date("2026-10-15T16:31:00.000Z")), null);
  });

  it("prazo mudou depois do toque: toca de novo na hora nova", () => {
    const moved = { ...hourBefore, sentFor: fireAt, task: { ...hourBefore.task, dueAt: new Date("2026-10-15T19:00:00.000Z") } };
    assert.equal(dueFireAt(moved, new Date("2026-10-15T18:00:00.000Z"))?.toISOString(), "2026-10-15T18:00:00.000Z");
  });

  it("Adiar 1 h toca de novo no horário adiado", () => {
    const snoozed = { ...hourBefore, sentFor: fireAt, snoozedUntil: new Date("2026-10-15T17:30:00.000Z") };
    assert.equal(effectiveFireAt(snoozed)?.toISOString(), "2026-10-15T17:30:00.000Z");
    assert.equal(dueFireAt(snoozed, new Date("2026-10-15T17:30:10.000Z"))?.toISOString(), "2026-10-15T17:30:00.000Z");
  });

  it("não toca o que já tinha passado ao criar nem o que passou há mais de 3 h", () => {
    const late = { ...hourBefore, createdAt: new Date("2026-10-15T17:00:00.000Z") };
    assert.equal(dueFireAt(late, new Date("2026-10-15T17:01:00.000Z")), null);
    assert.equal(dueFireAt(hourBefore, new Date("2026-10-15T19:31:00.000Z")), null);
  });

  it("antes do prazo sem prazo não toca", () => {
    assert.equal(dueFireAt({ ...hourBefore, task: { ...hourBefore.task, dueAt: null } }, new Date("2026-10-15T17:00:00.000Z")), null);
  });
});
