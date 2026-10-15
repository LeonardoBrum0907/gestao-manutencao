import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { priorityReminders } from "./priority-reminders";

const hourBefore = [{ kind: "before", minutesBefore: 60 }];

describe("lembrete padrão da tarefa alta", () => {
  it("tarefa que vira alta ganha 1 h antes", () => {
    assert.deepEqual(priorityReminders(null, { type: "task", priority: "high" }, 0), hourBefore);
    assert.deepEqual(priorityReminders("medium", { type: "task", priority: "high" }, 0), hourBefore);
  });

  it("não ganha se já era alta, se já tem lembrete, se não é alta ou se não é tarefa", () => {
    assert.deepEqual(priorityReminders("high", { type: "task", priority: "high" }, 0), []);
    assert.deepEqual(priorityReminders(null, { type: "task", priority: "high" }, 1), []);
    assert.deepEqual(priorityReminders(null, { type: "task", priority: "low" }, 0), []);
    assert.deepEqual(priorityReminders(null, { type: "feedback", priority: "high" }, 0), []);
  });
});
