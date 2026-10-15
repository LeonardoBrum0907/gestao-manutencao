import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import type { ReminderCandidate } from "../domain/reminder-schedule";
import { FakeReminderPush, FakeReminderStore } from "./fake-reminder-store";
import { ReminderDispatch } from "./reminder-dispatch";

const candidate: ReminderCandidate = {
  id: "r1",
  kind: "at",
  at: new Date("2026-10-15T12:00:00.000Z"),
  minutesBefore: null,
  snoozedUntil: null,
  sentFor: null,
  createdAt: new Date("2026-10-15T10:00:00.000Z"),
  task: { id: "t1", body: "Trocar correia", dueAt: null, dueHasTime: false },
};
const now = new Date("2026-10-15T12:00:20.000Z");

function setup(push: FakeReminderPush) {
  const store = new FakeReminderStore();
  store.candidatesList = [candidate, { ...candidate, id: "r2", at: new Date("2026-10-15T13:00:00.000Z") }];
  return { store, dispatch: new ReminderDispatch(store, push) };
}

describe("relógio dos lembretes", () => {
  it("manda só o que venceu e marca o toque", async () => {
    const push = new FakeReminderPush();
    const { store, dispatch } = setup(push);
    assert.deepEqual(await dispatch.tick(now), { due: 1, delivered: 1 });
    assert.deepEqual(push.messages.map((message) => message.title), ["Trocar correia"]);
    assert.deepEqual(store.sent, [{ id: "r1", fireAt: "2026-10-15T12:00:00.000Z" }]);
  });

  it("sem aparelho ou sem chaves, conta como tocado para não repetir", async () => {
    const noDevices = setup(new FakeReminderPush({ sent: 0, removed: 0, failed: 0 }));
    assert.deepEqual(await noDevices.dispatch.tick(now), { due: 1, delivered: 0 });
    assert.equal(noDevices.store.sent.length, 1);
    const noKeys = setup(new FakeReminderPush(new DomainError("push_keys", 503, "sem chaves")));
    assert.deepEqual(await noKeys.dispatch.tick(now), { due: 1, delivered: 0 });
    assert.equal(noKeys.store.sent.length, 1);
  });

  it("erro inesperado no envio sobe sem marcar", async () => {
    const { store, dispatch } = setup(new FakeReminderPush(new Error("banco caiu")));
    await assert.rejects(dispatch.tick(now), /banco caiu/);
    assert.equal(store.sent.length, 0);
  });
});
