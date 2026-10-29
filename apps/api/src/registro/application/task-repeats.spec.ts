import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RepeatSource } from "../domain/task-repeat-next";
import { FakeTaskRepeatStore } from "./fake-task-repeat-store";
import { TaskRepeats } from "./task-repeats";

const now = new Date("2026-11-02T15:00:00.000Z");
const daily: RepeatSource = {
  body: "Ronda na linha 3",
  memberId: null,
  memberIds: [],
  factoryId: null,
  tag: null,
  line: null,
  priority: null,
  notes: null,
  dueAt: new Date("2026-11-02T15:00:00.000Z"),
  dueHasTime: false,
  repeat: { every: "day" },
  reminders: [],
};

function setup(candidate: Partial<Parameters<FakeTaskRepeatStore["candidates"]["set"]>[1]> = {}) {
  const store = new FakeTaskRepeatStore();
  store.candidates.set("t1", { type: "task", status: "done", hasNext: false, source: daily, ...candidate });
  return { store, repeats: new TaskRepeats(store) };
}

describe("tarefa que se repete: ao salvar", () => {
  it("concluída com regra faz nascer a próxima, ligada à anterior", async () => {
    const { store, repeats } = setup();
    assert.equal(await repeats.afterSave("t1", now), "next-of-t1");
    assert.equal(store.inserted[0].previousId, "t1");
    assert.equal(store.inserted[0].next.state.dueAt?.toISOString(), "2026-11-03T15:00:00.000Z");
  });

  it("salvar de novo a concluída não faz nascer outra", async () => {
    const { store, repeats } = setup();
    await repeats.afterSave("t1", now);
    assert.equal(await repeats.afterSave("t1", now), null);
    assert.equal(store.inserted.length, 1);
  });

  it("reaberta pelo Desfazer apaga a próxima, e concluir de novo faz nascer outra", async () => {
    const { store, repeats } = setup();
    await repeats.afterSave("t1", now);
    store.candidates.set("t1", { ...store.candidates.get("t1")!, status: "open" });
    assert.equal(await repeats.afterSave("t1", now), null);
    assert.deepEqual(store.removedNextOf, ["t1"]);
    store.candidates.set("t1", { ...store.candidates.get("t1")!, status: "done" });
    assert.equal(await repeats.afterSave("t1", now), "next-of-t1");
    assert.equal(store.inserted.length, 2);
  });

  it("aberta, sem regra ou que não é tarefa não faz nascer nada", async () => {
    for (const candidate of [{ status: "open" as const }, { source: null }, { type: "problem" as const }]) {
      const { store, repeats } = setup(candidate);
      assert.equal(await repeats.afterSave("t1", now), null);
      assert.equal(store.inserted.length, 0);
    }
  });

  it("registro que não existe não faz nascer nada", async () => {
    const { repeats } = setup();
    assert.equal(await repeats.afterSave("sumiu", now), null);
  });
});
