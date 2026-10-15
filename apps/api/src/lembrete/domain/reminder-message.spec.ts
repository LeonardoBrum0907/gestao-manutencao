import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dueText, reminderMessage } from "./reminder-message";

const now = new Date("2026-10-15T12:00:00.000Z");

describe("lembrete: notificação", () => {
  it("diz o prazo em Brasília: hoje, amanhã ou a data, com hora só se tiver", () => {
    assert.equal(dueText({ dueAt: new Date("2026-10-15T17:30:00.000Z"), dueHasTime: true }, now), "Prazo hoje às 14:30");
    assert.equal(dueText({ dueAt: new Date("2026-10-16T15:00:00.000Z"), dueHasTime: false }, now), "Prazo amanhã");
    assert.equal(dueText({ dueAt: new Date("2026-10-20T15:00:00.000Z"), dueHasTime: false }, now), "Prazo 20/10");
    assert.equal(dueText({ dueAt: new Date("2026-10-15T11:00:00.000Z"), dueHasTime: true }, now), "Venceu hoje às 08:00");
    assert.equal(dueText({ dueAt: null, dueHasTime: false }, now), "Sem prazo");
  });

  it("título é a primeira linha da tarefa e os botões chamam a API", () => {
    const message = reminderMessage({ id: "t1", body: "Trocar correia\nda M91", dueAt: null, dueHasTime: false }, "r1", now);
    assert.equal(message.title, "Trocar correia");
    assert.equal(message.url, "/registros/t1");
    assert.equal(message.tag, "lembrete:t1");
    assert.deepEqual(message.actions?.map((action) => [action.title, action.method, action.path]), [
      ["Concluir", "PATCH", "/api/records/t1/board"],
      ["Adiar 1 h", "POST", "/api/reminders/r1/snooze"],
    ]);
  });
});
