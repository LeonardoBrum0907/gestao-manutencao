import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { beforeLabel, defaultTaskReminders, reminderFireAt } from "./reminder";

const timed = { dueAt: "2026-10-16T17:30:00.000Z", dueHasTime: true };
// Prazo só com dia: fica ao meio-dia de Brasília (15h UTC).
const dayOnly = { dueAt: "2026-10-16T15:00:00.000Z", dueHasTime: false };

describe("lembrete: quando toca", () => {
  it("data e hora fixa toca naquela hora, com ou sem prazo", () => {
    const rule = { kind: "at" as const, at: "2026-10-15T11:00:00.000Z", minutesBefore: null };
    assert.equal(reminderFireAt(rule, { dueAt: null, dueHasTime: false })?.toISOString(), "2026-10-15T11:00:00.000Z");
  });

  it("antes do prazo com horário desconta os minutos", () => {
    const rule = { kind: "before" as const, at: null, minutesBefore: 60 };
    assert.equal(reminderFireAt(rule, timed)?.toISOString(), "2026-10-16T16:30:00.000Z");
    assert.equal(reminderFireAt({ ...rule, minutesBefore: 0 }, timed)?.toISOString(), "2026-10-16T17:30:00.000Z");
  });

  it("prazo só com dia toca às 7h de Brasília do dia ou da véspera", () => {
    const rule = { kind: "before" as const, at: null, minutesBefore: 60 };
    assert.equal(reminderFireAt(rule, dayOnly)?.toISOString(), "2026-10-16T10:00:00.000Z");
    assert.equal(reminderFireAt({ ...rule, minutesBefore: 1440 }, dayOnly)?.toISOString(), "2026-10-15T10:00:00.000Z");
  });

  it("antes do prazo sem prazo não toca", () => {
    assert.equal(reminderFireAt({ kind: "before", at: null, minutesBefore: 60 }, { dueAt: null, dueHasTime: false }), null);
  });
});

describe("lembrete: padrão e rótulos", () => {
  it("só tarefa alta nasce com 1 h antes", () => {
    assert.deepEqual(defaultTaskReminders("high"), [{ kind: "before", minutesBefore: 60 }]);
    assert.deepEqual(defaultTaskReminders("medium"), []);
    assert.deepEqual(defaultTaskReminders(null), []);
  });

  it("rótulo muda com o prazo ter horário", () => {
    assert.equal(beforeLabel(0, true), "Na hora do prazo");
    assert.equal(beforeLabel(15, true), "15 min antes");
    assert.equal(beforeLabel(60, true), "1 h antes");
    assert.equal(beforeLabel(1440, true), "1 dia antes");
    assert.equal(beforeLabel(60, false), "No dia às 7h");
    assert.equal(beforeLabel(1440, false), "1 dia antes às 7h");
    assert.equal(beforeLabel(2880, false), "2 dias antes às 7h");
  });
});
