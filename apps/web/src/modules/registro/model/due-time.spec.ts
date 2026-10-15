import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dueAtWithClock, dueClockOf, withDueClock, withDueDay } from "./due-time";

const dayOnly = { dueAt: "2026-10-16T15:00:00.000Z", dueHasTime: false };
const timed = { dueAt: "2026-10-16T17:30:00.000Z", dueHasTime: true };

describe("prazo com horário", () => {
  it("lê e escreve o horário de Brasília", () => {
    assert.equal(dueClockOf(timed.dueAt), "14:30");
    assert.equal(dueAtWithClock("2026-10-16", "14:30"), timed.dueAt);
    assert.throws(() => dueAtWithClock("2026-10-16", "25:00"), /HH:MM/);
  });

  it("trocar o dia mantém o horário escolhido; sem horário fica ao meio-dia", () => {
    assert.deepEqual(withDueDay(timed, "2026-10-20"), { dueAt: "2026-10-20T17:30:00.000Z", dueHasTime: true });
    assert.deepEqual(withDueDay(dayOnly, "2026-10-20"), { dueAt: "2026-10-20T15:00:00.000Z", dueHasTime: false });
    assert.deepEqual(withDueDay(timed, null), { dueAt: null, dueHasTime: false });
  });

  it("escolher o horário marca o prazo com hora; apagar volta ao dia", () => {
    assert.deepEqual(withDueClock(dayOnly, "08:00"), { dueAt: "2026-10-16T11:00:00.000Z", dueHasTime: true });
    assert.deepEqual(withDueClock(timed, ""), dayOnly);
    assert.deepEqual(withDueClock({ dueAt: null, dueHasTime: false }, "08:00"), { dueAt: null, dueHasTime: false });
  });
});
