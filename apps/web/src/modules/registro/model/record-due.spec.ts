import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { recordDue } from "./record-due";

const today = "2026-10-15";

describe("recordDue", () => {
  it("sem prazo devolve null", () => {
    assert.equal(recordDue({ dueAt: null, dueHasTime: false, status: "open" }, today), null);
  });

  it("prazo passado e aberto conta como atrasado", () => {
    assert.deepEqual(recordDue({ dueAt: "2026-10-10T15:00:00.000Z", dueHasTime: false, status: "open" }, today), { text: "10 out", late: true });
  });

  it("concluído nunca conta como atrasado", () => {
    assert.deepEqual(recordDue({ dueAt: "2026-10-10T15:00:00.000Z", dueHasTime: false, status: "done" }, today), { text: "10 out", late: false });
  });

  it("hoje e amanhã pelo nome, com o horário quando o prazo tem hora", () => {
    assert.deepEqual(recordDue({ dueAt: "2026-10-15T15:00:00.000Z", dueHasTime: false, status: "open" }, today), { text: "Hoje", late: false });
    assert.deepEqual(recordDue({ dueAt: "2026-10-16T17:30:00.000Z", dueHasTime: true, status: "in_progress" }, today), { text: "Amanhã 14:30", late: false });
  });
});
