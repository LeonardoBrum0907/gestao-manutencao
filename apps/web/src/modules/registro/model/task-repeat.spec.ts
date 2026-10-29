import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BoardItemDto, TaskRepeat } from "@manutencao/shared";
import { choiceOfRepeat, repeatChoiceLabel, repeatGhosts, repeatOfChoice, repeatPatch, toggleWeekday } from "./task-repeat";

// 2026-11-02 é segunda-feira.
const mondays = { every: "week", interval: 1, weekdays: [1], since: "2026-11-02" } as const satisfies TaskRepeat;

function task(overrides: Partial<BoardItemDto>): BoardItemDto {
  return {
    id: "t1",
    type: "task",
    body: "Ronda",
    status: "open",
    origin: "inbox",
    priority: null,
    dueAt: "2026-11-02T15:00:00.000Z",
    dueHasTime: false,
    occurredAt: "2026-10-29T12:00:00.000Z",
    repeat: mondays,
    group: "upcoming",
    completedAt: null,
    ...overrides,
  };
}

describe("repetir: opções da ficha", () => {
  it("toda semana cai no dia da semana do prazo e todo mês no dia do mês", () => {
    assert.deepEqual(repeatOfChoice("week", "2026-11-04"), { every: "week", interval: 1, weekdays: [3], since: "2026-11-04" });
    assert.deepEqual(repeatOfChoice("month", "2026-11-04"), { every: "month", dayOfMonth: 4 });
    assert.equal(choiceOfRepeat(repeatOfChoice("biweek", "2026-11-04")), "biweek");
  });

  it("rótulo diz onde a opção cai; a regra gravada mostra os dias dela", () => {
    assert.equal(repeatChoiceLabel("week", null, "2026-11-04"), "Toda semana (quarta)");
    assert.equal(repeatChoiceLabel("week", { ...mondays, weekdays: [1, 3] }, "2026-11-04"), "Toda seg e qua");
    assert.equal(repeatChoiceLabel("month", null, "2026-11-04"), "Todo mês (dia 4)");
  });

  it("liga e desliga dias, mas o último dia não sai", () => {
    const both = toggleWeekday(mondays, 3);
    assert.deepEqual(both.every === "week" && both.weekdays, [1, 3]);
    assert.deepEqual(toggleWeekday(mondays, 1), mondays);
  });

  it("tarefa sem prazo ganha o primeiro dia da regra a partir de hoje", () => {
    const patch = repeatPatch({ dueAt: null, dueHasTime: false }, { every: "workday" }, "2026-10-31");
    assert.equal(patch.dueAt, "2026-11-02T15:00:00.000Z");
  });

  it("tarefa com prazo mantém o prazo", () => {
    assert.deepEqual(repeatPatch({ dueAt: "2026-11-05T15:00:00.000Z", dueHasTime: false }, mondays, "2026-10-31"), { repeat: mondays });
  });
});

describe("repetir: próximas vezes na Agenda", () => {
  const week = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09"];

  it("mostra as próximas depois do prazo, não o próprio prazo", () => {
    const ghosts = repeatGhosts([task({})], week, "2026-11-02");
    assert.deepEqual(Object.keys(ghosts), ["2026-11-09"]);
  });

  // Atrasada: a próxima nasce depois de hoje, então a Agenda não mostra nada antes disso.
  it("atrasada mostra a partir de amanhã", () => {
    const ghosts = repeatGhosts([task({ dueAt: "2026-10-26T15:00:00.000Z", repeat: { every: "day" } })], week, "2026-11-02");
    assert.equal(ghosts["2026-11-02"], undefined);
    assert.equal(ghosts["2026-11-03"]?.length, 1);
  });

  it("concluída, sem regra ou sem prazo não aparece", () => {
    const items = [task({ status: "done" }), task({ repeat: null }), task({ dueAt: null })];
    assert.deepEqual(repeatGhosts(items, week, "2026-11-01"), {});
  });
});
