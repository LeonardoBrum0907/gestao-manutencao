import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextRepeatDay, readTaskRepeat, repeatDayAfter, repeatDaysBetween, repeatFallsOn, taskRepeatLabel, type TaskRepeat } from "./task-repeat";

// 2026-11-02 é segunda-feira.
const mondays: TaskRepeat = { every: "week", interval: 1, weekdays: [1], since: "2026-11-02" };
const biweekly: TaskRepeat = { every: "week", interval: 2, weekdays: [1, 3], since: "2026-11-02" };

describe("repetição: em que dia cai", () => {
  it("dias úteis pulam sábado e domingo", () => {
    assert.equal(repeatDayAfter({ every: "workday" }, "2026-10-30"), "2026-11-02");
  });

  it("toda segunda vai de segunda em segunda", () => {
    assert.equal(repeatDayAfter(mondays, "2026-11-02"), "2026-11-09");
  });

  it("a cada 2 semanas pula a semana do meio, contando da semana em que começou", () => {
    assert.equal(repeatDayAfter(biweekly, "2026-11-02"), "2026-11-04");
    assert.equal(repeatDayAfter(biweekly, "2026-11-04"), "2026-11-16");
    assert.equal(repeatFallsOn(biweekly, "2026-11-09"), false);
  });

  it("todo dia 31 cai no último dia do mês curto", () => {
    const rule: TaskRepeat = { every: "month", dayOfMonth: 31 };
    assert.equal(repeatDayAfter(rule, "2026-10-31"), "2026-11-30");
    assert.equal(repeatDayAfter(rule, "2027-01-31"), "2027-02-28");
  });
});

describe("repetição: prazo da próxima ao concluir", () => {
  it("concluída no dia vem a próxima segunda", () => {
    assert.equal(nextRepeatDay(mondays, "2026-11-02", "2026-11-02"), "2026-11-09");
  });

  it("concluída adiantada conta a partir do prazo", () => {
    assert.equal(nextRepeatDay(mondays, "2026-11-09", "2026-11-04"), "2026-11-16");
  });

  // Atrasada não pode gerar outra já atrasada: conta a partir de hoje.
  it("concluída atrasada conta a partir de hoje", () => {
    assert.equal(nextRepeatDay(mondays, "2026-10-26", "2026-11-04"), "2026-11-09");
  });

  it("sem prazo conta a partir de hoje", () => {
    assert.equal(nextRepeatDay({ every: "day" }, null, "2026-11-04"), "2026-11-05");
  });
});

describe("repetição: próximas datas na Agenda", () => {
  it("lista só os dias da janela depois do prazo atual", () => {
    assert.deepEqual(repeatDaysBetween(mondays, "2026-11-02", "2026-11-01", "2026-11-30"), ["2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30"]);
  });

  it("janela que começa depois do prazo não repete dias de antes", () => {
    assert.deepEqual(repeatDaysBetween({ every: "day" }, "2026-11-02", "2026-11-05", "2026-11-06"), ["2026-11-05", "2026-11-06"]);
  });
});

describe("repetição: ler e escrever a regra", () => {
  it("aceita semana com dias e ordena sem repetir", () => {
    assert.deepEqual(readTaskRepeat({ every: "week", interval: 1, weekdays: [3, 1, 3], since: "2026-11-02" }), {
      every: "week",
      interval: 1,
      weekdays: [1, 3],
      since: "2026-11-02",
    });
  });

  it("recusa semana sem dia, intervalo 3 e mês 32", () => {
    assert.equal(readTaskRepeat({ every: "week", interval: 1, weekdays: [], since: "2026-11-02" }), null);
    assert.equal(readTaskRepeat({ every: "week", interval: 3, weekdays: [1], since: "2026-11-02" }), null);
    assert.equal(readTaskRepeat({ every: "month", dayOfMonth: 32 }), null);
    assert.equal(readTaskRepeat("toda segunda"), null);
  });

  it("escreve o rótulo em português", () => {
    assert.equal(taskRepeatLabel(mondays), "Toda segunda");
    assert.equal(taskRepeatLabel({ ...mondays, weekdays: [0] }), "Todo domingo");
    assert.equal(taskRepeatLabel(biweekly), "A cada 2 semanas: seg e qua");
    assert.equal(taskRepeatLabel({ every: "month", dayOfMonth: 5 }), "Todo dia 5 do mês");
  });
});
