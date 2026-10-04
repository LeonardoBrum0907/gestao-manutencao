import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FollowUpSubject } from "./follow-up";
import { matchesFollowUp, taskDueWindow } from "./follow-up";

const now = new Date("2026-09-30T15:00:00.000Z");

function subject(partial: Partial<FollowUpSubject> & Pick<FollowUpSubject, "type">): FollowUpSubject {
  return {
    status: "open",
    dueAt: null,
    ...partial,
  };
}

describe("prazo da tarefa", () => {
  it("classifica vencida, hoje, amanhã e depois no calendário do gestor", () => {
    assert.equal(taskDueWindow(new Date("2026-09-29T15:00:00.000Z"), now), "overdue");
    assert.equal(taskDueWindow(new Date("2026-09-30T15:00:00.000Z"), now), "today");
    assert.equal(taskDueWindow(new Date("2026-10-01T15:00:00.000Z"), now), "tomorrow");
    assert.equal(taskDueWindow(new Date("2026-10-02T15:00:00.000Z"), now), "later");
  });

  it("vira o dia em São Paulo, não em UTC", () => {
    assert.equal(taskDueWindow(new Date("2026-10-01T02:00:00.000Z"), now), "today");
    assert.equal(taskDueWindow(new Date("2026-09-30T02:00:00.000Z"), now), "overdue");
  });

  it("amanhã atravessa o ano", () => {
    const yearEnd = new Date("2026-12-31T15:00:00.000Z");
    assert.equal(taskDueWindow(new Date("2027-01-01T15:00:00.000Z"), yearEnd), "tomorrow");
  });

  it("prazo só entra na tarefa", () => {
    const dueToday = new Date("2026-09-30T15:00:00.000Z");
    const filter = { type: null, status: null, due: "today" as const };
    assert.equal(matchesFollowUp(subject({ type: "task", dueAt: dueToday }), filter, now), true);
    assert.equal(matchesFollowUp(subject({ type: "feedback", dueAt: dueToday }), filter, now), false);
    assert.equal(matchesFollowUp(subject({ type: "problem", dueAt: dueToday }), filter, now), false);
    assert.equal(matchesFollowUp(subject({ type: "task", dueAt: null }), filter, now), false);
  });

  it("tarefa concluída não conta como vencida nem como vence hoje", () => {
    const pastDue = subject({ type: "task", status: "done", dueAt: new Date("2026-09-28T15:00:00.000Z") });
    const todayDue = subject({ type: "task", status: "done", dueAt: new Date("2026-09-30T15:00:00.000Z") });
    assert.equal(matchesFollowUp(pastDue, { type: null, status: null, due: "overdue" }, now), false);
    assert.equal(matchesFollowUp(todayDue, { type: null, status: null, due: "today" }, now), false);
  });

  it("combina tipo, status e prazo", () => {
    const overdue = subject({
      type: "task",
      status: "in_progress",
      dueAt: new Date("2026-09-28T15:00:00.000Z"),
    });
    assert.equal(
      matchesFollowUp(overdue, { type: "task", status: "in_progress", due: "overdue" }, now),
      true,
    );
    assert.equal(
      matchesFollowUp(overdue, { type: "task", status: "done", due: "overdue" }, now),
      false,
    );
    assert.equal(matchesFollowUp(overdue, { type: null, status: null, due: null }, now), true);
  });
});
