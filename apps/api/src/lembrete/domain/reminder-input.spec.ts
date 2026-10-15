import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertCanAddReminder, parseReminderBody, reminderWrite } from "./reminder-input";

function rejects(run: () => unknown, statusCode: number, part: string) {
  assert.throws(run, (error: unknown) => error instanceof DomainError && error.statusCode === statusCode && error.message.includes(part));
}

describe("lembrete: entrada", () => {
  it("lê data e hora fixa e minutos antes", () => {
    assert.deepEqual(parseReminderBody({ kind: "at", at: "2026-10-16T07:30:00-03:00" }), { kind: "at", at: new Date("2026-10-16T10:30:00.000Z"), minutesBefore: null });
    assert.deepEqual(parseReminderBody({ kind: "before", minutesBefore: 60 }), { kind: "before", at: null, minutesBefore: 60 });
  });

  it("recusa tipo, data e minutos fora do formato, dizendo o esperado", () => {
    rejects(() => parseReminderBody({ kind: "daily" }), 400, '"at" ou "before"');
    rejects(() => parseReminderBody({ kind: "at", at: "amanhã" }), 400, "ISO 8601");
    rejects(() => parseReminderBody({ kind: "before", minutesBefore: -5 }), 400, "de 0 a 10080");
    rejects(() => parseReminderBody({ kind: "before", minutesBefore: 1.5 }), 400, "inteiro");
  });

  it("converte o lembrete padrão para gravar", () => {
    assert.deepEqual(reminderWrite({ kind: "before", minutesBefore: 60 }), { kind: "before", at: null, minutesBefore: 60 });
  });

  it("só tarefa tem lembrete, até 5", () => {
    assert.doesNotThrow(() => assertCanAddReminder({ type: "task" }, 4));
    rejects(() => assertCanAddReminder(null, 0), 404, "não encontrada");
    rejects(() => assertCanAddReminder({ type: "problem" }, 0), 400, "problem");
    rejects(() => assertCanAddReminder({ type: "task" }, 5), 400, "máximo é 5");
  });
});
