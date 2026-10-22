import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { brasiliaDay, demoDay, demoMoment } from "./demo-calendar";

const today = new Date("2026-10-22T15:00:00Z");

describe("datas da demonstração", () => {
  it("põe o horário de Brasília no dia pedido", () => {
    assert.equal(demoMoment(today, 1, 9, 30).toISOString(), "2026-10-21T12:30:00.000Z");
  });

  it("conta o dia em Brasília, não em UTC", () => {
    assert.equal(brasiliaDay(new Date("2026-10-22T02:00:00Z")), "2026-10-21");
    assert.equal(demoMoment(new Date("2026-10-22T02:00:00Z"), 0, 9).toISOString(), "2026-10-21T12:00:00.000Z");
  });

  it("aceita dias no futuro", () => {
    assert.equal(demoDay(today, -3), "2026-10-25");
  });
});
