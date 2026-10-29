import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TaskReminderDto } from "@manutencao/shared";
import { presetNote, reminderPresets } from "./reminder-presets";

const saved = (rule: Partial<TaskReminderDto>): TaskReminderDto => ({
  id: "r1",
  recordId: "t1",
  kind: "before",
  at: null,
  minutesBefore: 60,
  snoozedUntil: null,
  createdAt: "2026-10-28T10:00:00.000Z",
  ...rule,
});
// Quarta, 28 out, 21:55 em Brasília.
const now = new Date("2026-10-29T00:55:00.000Z");
const today = "2026-10-28";
const timed = { dueAt: "2026-10-30T17:30:00.000Z", dueHasTime: true };
const dayOnly = { dueAt: "2026-10-31T15:00:00.000Z", dueHasTime: false };
const noDue = { dueAt: null, dueHasTime: false };

describe("atalhos de lembrete", () => {
  it("prazo com horário: minutos e horas antes, com a hora em que toca", () => {
    const presets = reminderPresets(timed, [], now, today);
    assert.deepEqual(presets.map((preset) => preset.label), ["Na hora", "15 min antes", "30 min antes", "1 h antes", "2 h antes", "1 dia antes"]);
    assert.equal(presets[3].fireAt.toISOString(), "2026-10-30T16:30:00.000Z");
    assert.deepEqual(presets[3].body, { kind: "before", minutesBefore: 60 });
  });

  it("prazo só com dia: no dia e na véspera, às 7h", () => {
    const presets = reminderPresets(dayOnly, [], now, today);
    assert.deepEqual(presets.map((preset) => preset.label), ["No dia às 7h", "Na véspera às 7h"]);
    assert.equal(presets[1].fireAt.toISOString(), "2026-10-30T10:00:00.000Z");
  });

  it("sem prazo: horas fixas a partir de agora", () => {
    const presets = reminderPresets(noDue, [], now, today);
    assert.deepEqual(presets.map((preset) => preset.label), ["Daqui a 1 h", "Amanhã cedo", "Amanhã à tarde"]);
    assert.deepEqual(presets.map((preset) => preset.fireAt.toISOString()), ["2026-10-29T01:55:00.000Z", "2026-10-29T10:00:00.000Z", "2026-10-29T16:00:00.000Z"]);
  });

  it("marca o que a tarefa já tem, para tocar de novo e tirar", () => {
    const presets = reminderPresets(timed, [saved({ id: "r9" })], now, today);
    assert.deepEqual(presets.map((preset) => preset.savedId), [null, null, null, "r9", null, null]);
    const fixed = reminderPresets(noDue, [saved({ id: "r7", kind: "at", at: "2026-10-29T10:00:00.000Z", minutesBefore: null })], now, today);
    assert.equal(fixed[1].savedId, "r7");
  });

  it("prazo só com dia compara em dias: o padrão de 1 h vale como no dia às 7h", () => {
    assert.equal(reminderPresets(dayOnly, [saved({ id: "r3" })], now, today)[0].savedId, "r3");
  });

  it("o que já passou fica de fora, menos o que já está gravado", () => {
    const soon = { dueAt: "2026-10-29T12:00:00.000Z", dueHasTime: true };
    assert.deepEqual(reminderPresets(soon, [], now, today).map((preset) => preset.past), [false, false, false, false, false, true]);
    const gone = reminderPresets(soon, [saved({ id: "r5", minutesBefore: 1440 })], now, today)[5];
    assert.deepEqual([gone.past, gone.savedId], [false, "r5"]);
  });

  it("nota explica as 7h ou o que aparece com prazo", () => {
    assert.equal(presetNote(timed), null);
    assert.equal(presetNote(dayOnly), "Às 7h porque o prazo não tem horário.");
    assert.equal(presetNote(noDue), "Com prazo, aparecem opções antes do prazo.");
  });
});
