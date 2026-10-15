import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { FakeReminderStore } from "./fake-reminder-store";
import { TaskReminders } from "./task-reminders";

function setup() {
  const store = new FakeReminderStore();
  store.tasks.set("t1", { type: "task" });
  store.tasks.set("p1", { type: "problem" });
  return { store, reminders: new TaskReminders(store) };
}

describe("lembretes da tarefa", () => {
  it("cria, lista e tira", async () => {
    const { reminders } = setup();
    const created = await reminders.add("t1", { kind: "before", minutesBefore: 60 });
    assert.deepEqual((await reminders.list("t1")).map((item) => item.minutesBefore), [60]);
    await reminders.remove(created.id);
    assert.deepEqual(await reminders.list("t1"), []);
  });

  it("recusa registro que não é tarefa e lembrete que não existe", async () => {
    const { reminders } = setup();
    await assert.rejects(reminders.add("p1", { kind: "before", minutesBefore: 60 }), (error: unknown) => error instanceof DomainError && error.statusCode === 400);
    await assert.rejects(reminders.remove("nada"), (error: unknown) => error instanceof DomainError && error.statusCode === 404);
  });

  it("adiar empurra o toque 1 h para frente", async () => {
    const { reminders, store } = setup();
    const created = await reminders.add("t1", { kind: "at", at: "2026-10-15T12:00:00.000Z" });
    const result = await reminders.snooze(created.id, new Date("2026-10-15T12:00:30.000Z"));
    assert.equal(result.snoozedUntil, "2026-10-15T13:00:30.000Z");
    assert.equal(store.reminders[0].snoozedUntil, "2026-10-15T13:00:30.000Z");
  });
});
