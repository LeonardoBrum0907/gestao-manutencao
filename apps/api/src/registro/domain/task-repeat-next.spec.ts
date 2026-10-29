import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextTask, type RepeatSource } from "./task-repeat-next";

// Segunda 02/11/2026 às 9h de Brasília (12h UTC).
const mondayNine = new Date("2026-11-02T12:00:00.000Z");

function source(overrides: Partial<RepeatSource> = {}): RepeatSource {
  return {
    body: "Conferir lubrificação da encartuchadeira",
    memberId: "m1",
    memberIds: ["m1", "m2"],
    factoryId: "f1",
    tag: "MED 03",
    line: "Linha 3",
    priority: "high",
    notes: "Ver nível do tanque",
    dueAt: mondayNine,
    dueHasTime: true,
    repeat: { every: "week", interval: 1, weekdays: [1], since: "2026-11-02" },
    reminders: [],
    ...overrides,
  };
}

describe("tarefa que se repete: a próxima", () => {
  it("nasce aberta na segunda seguinte, no mesmo horário, com o mesmo texto e local", () => {
    const { state } = nextTask(source(), new Date("2026-11-02T15:00:00.000Z"));
    assert.equal(state.dueAt?.toISOString(), "2026-11-09T12:00:00.000Z");
    assert.equal(state.status, "open");
    assert.equal(state.dueHasTime, true);
    assert.deepEqual([state.body, state.tag, state.line, state.priority, state.memberId], ["Conferir lubrificação da encartuchadeira", "MED 03", "Linha 3", "high", "m1"]);
    assert.deepEqual(state.memberIds, ["m1", "m2"]);
  });

  // Regressão do desenho: concluir atrasada não pode criar outra já vencida.
  it("concluída atrasada cai na próxima segunda a partir de hoje", () => {
    const { state } = nextTask(source(), new Date("2026-11-11T15:00:00.000Z"));
    assert.equal(state.dueAt?.toISOString(), "2026-11-16T12:00:00.000Z");
  });

  it("sem prazo, nasce no próximo dia da regra ao meio-dia, sem horário", () => {
    const { state } = nextTask(source({ dueAt: null, dueHasTime: false, repeat: { every: "day" } }), new Date("2026-11-02T15:00:00.000Z"));
    assert.equal(state.dueAt?.toISOString(), "2026-11-03T15:00:00.000Z");
    assert.equal(state.dueHasTime, false);
  });

  it("lembrete antes do prazo vai igual; data fixa anda junto com o prazo", () => {
    const reminders = [
      { kind: "before" as const, at: null, minutesBefore: 60 },
      { kind: "at" as const, at: "2026-11-01T22:00:00.000Z", minutesBefore: null },
    ];
    const next = nextTask(source({ reminders }), new Date("2026-11-02T15:00:00.000Z"));
    assert.deepEqual(next.reminders, [
      { kind: "before", minutesBefore: 60 },
      { kind: "at", at: "2026-11-08T22:00:00.000Z" },
    ]);
  });

  it("lembrete de data fixa numa tarefa sem prazo fica só na concluída", () => {
    const reminders = [{ kind: "at" as const, at: "2026-11-01T22:00:00.000Z", minutesBefore: null }];
    const next = nextTask(source({ dueAt: null, dueHasTime: false, reminders }), new Date("2026-11-02T15:00:00.000Z"));
    assert.deepEqual(next.reminders, []);
  });
});
