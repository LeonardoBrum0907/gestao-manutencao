import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TaskReminderDto } from "@manutencao/shared";
import { fireShortText, reminderText, sortedByFire } from "./reminders";

const base: TaskReminderDto = { id: "r1", recordId: "t1", kind: "before", at: null, minutesBefore: 60, snoozedUntil: null, createdAt: "2026-10-16T10:00:00.000Z" };
const now = new Date("2026-10-16T12:00:00.000Z");
const today = "2026-10-16";

describe("lembretes na ficha", () => {
  it("antes do prazo mostra primeiro quando toca e embaixo a regra", () => {
    assert.deepEqual(reminderText(base, { dueAt: "2026-10-16T17:30:00.000Z", dueHasTime: true }, today, now), { title: "Hoje às 13:30", detail: "1 h antes do prazo" });
    assert.deepEqual(reminderText({ ...base, minutesBefore: 0 }, { dueAt: "2026-10-16T17:30:00.000Z", dueHasTime: true }, today, now), { title: "Hoje às 14:30", detail: "Na hora do prazo" });
  });

  it("prazo só com dia explica as 7h", () => {
    assert.deepEqual(reminderText(base, { dueAt: "2026-10-17T15:00:00.000Z", dueHasTime: false }, today, now), { title: "Amanhã às 07:00", detail: "No dia do prazo, às 7h" });
    assert.deepEqual(reminderText({ ...base, minutesBefore: 1440 }, { dueAt: "2026-10-18T15:00:00.000Z", dueHasTime: false }, today, now), { title: "Amanhã às 07:00", detail: "Na véspera do prazo, às 7h" });
  });

  it("sem prazo, a regra fica no título até a tarefa ganhar prazo", () => {
    assert.deepEqual(reminderText(base, { dueAt: null, dueHasTime: false }, today, now), { title: "1 h antes", detail: "Toca quando a tarefa tiver prazo" });
  });

  it("hora marcada diz isso; adiado mostra para quando", () => {
    const at = { ...base, kind: "at" as const, at: "2026-10-17T10:30:00.000Z", minutesBefore: null };
    assert.deepEqual(reminderText(at, { dueAt: null, dueHasTime: false }, today, now), { title: "Amanhã às 07:30", detail: "Hora marcada" });
    const snoozed = { ...at, snoozedUntil: "2026-10-16T13:00:00.000Z" };
    assert.equal(reminderText(snoozed, { dueAt: null, dueHasTime: false }, today, now).detail, "Adiado para hoje às 10:00");
  });

  it("lista na ordem em que tocam, com os que esperam prazo no fim", () => {
    const due = { dueAt: "2026-10-16T17:30:00.000Z", dueHasTime: true };
    const fixed = { ...base, id: "fixo", kind: "at" as const, at: "2026-10-16T13:00:00.000Z", minutesBefore: null };
    const hourBefore = { ...base, id: "1h" };
    const atDue = { ...base, id: "prazo", minutesBefore: 0 };
    assert.deepEqual(sortedByFire([atDue, hourBefore, fixed], due).map((reminder) => reminder.id), ["fixo", "1h", "prazo"]);
    assert.deepEqual(sortedByFire([hourBefore, fixed], { dueAt: null, dueHasTime: false }).map((reminder) => reminder.id), ["fixo", "1h"]);
  });

  it("hora curta dos atalhos", () => {
    assert.equal(fireShortText(new Date("2026-10-18T10:00:00.000Z"), today), "18 out, 07:00");
    assert.equal(fireShortText(new Date("2026-10-16T16:30:00.000Z"), today), "Hoje, 13:30");
  });
});
