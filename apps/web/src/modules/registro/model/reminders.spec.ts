import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TaskReminderDto } from "@manutencao/shared";
import { beforeOptions, reminderText } from "./reminders";

const base: TaskReminderDto = { id: "r1", recordId: "t1", kind: "before", at: null, minutesBefore: 60, snoozedUntil: null, createdAt: "2026-10-16T10:00:00.000Z" };
const now = new Date("2026-10-16T12:00:00.000Z");
const today = "2026-10-16";

describe("lembretes na ficha", () => {
  it("antes do prazo mostra a regra e a hora em que toca", () => {
    assert.deepEqual(reminderText(base, { dueAt: "2026-10-16T17:30:00.000Z", dueHasTime: true }, today, now), { label: "1 h antes", when: "Hoje às 13:30" });
    assert.deepEqual(reminderText(base, { dueAt: "2026-10-17T15:00:00.000Z", dueHasTime: false }, today, now), { label: "No dia às 7h", when: "Amanhã às 07:00" });
    assert.deepEqual(reminderText(base, { dueAt: null, dueHasTime: false }, today, now), { label: "1 h antes", when: "Toca quando a tarefa tiver prazo" });
  });

  it("data e hora fixa mostra o dia; adiado mostra para quando", () => {
    const at = { ...base, kind: "at" as const, at: "2026-10-17T10:30:00.000Z", minutesBefore: null };
    assert.deepEqual(reminderText(at, { dueAt: null, dueHasTime: false }, today, now), { label: "Amanhã às 07:30", when: null });
    const snoozed = { ...at, snoozedUntil: "2026-10-16T13:00:00.000Z" };
    assert.equal(reminderText(snoozed, { dueAt: null, dueHasTime: false }, today, now).when, "Adiado para hoje às 10:00");
  });

  it("opções mudam com o prazo ter horário", () => {
    assert.deepEqual(beforeOptions(false).map((option) => option.label), ["No dia às 7h", "1 dia antes às 7h"]);
    assert.deepEqual(beforeOptions(true).map((option) => option.label), ["Na hora do prazo", "15 min antes", "30 min antes", "1 h antes", "2 h antes", "1 dia antes"]);
  });
});
