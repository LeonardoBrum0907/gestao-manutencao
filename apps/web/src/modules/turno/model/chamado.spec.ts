import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { closingInstant, instant } from "./chamado";

describe("hora de fechamento do chamado", () => {
  it("fechamento depois da abertura fica no mesmo dia", () => {
    assert.deepEqual(closingInstant("2026-10-14", "15:10", "16:30"), instant("2026-10-14", "16:30"));
  });

  it("fechamento antes da abertura é do dia seguinte (3º turno)", () => {
    assert.deepEqual(closingInstant("2026-10-14", "23:10", "01:20"), instant("2026-10-15", "01:20"));
  });

  it("com o dia do fechamento conhecido, usa esse dia: aberto em 14/10 e fechado \"Agora\" em 16/10", () => {
    assert.deepEqual(closingInstant("2026-10-14", "15:10", "04:12", "2026-10-16"), instant("2026-10-16", "04:12"));
    assert.deepEqual(closingInstant("2026-10-14", "15:10", "16:00", "2026-10-15"), instant("2026-10-15", "16:00"));
  });

  it("dia do fechamento igual ou anterior ao da abertura volta para a regra do mesmo dia ou do seguinte", () => {
    assert.deepEqual(closingInstant("2026-10-14", "15:10", "16:30", "2026-10-14"), instant("2026-10-14", "16:30"));
    assert.deepEqual(closingInstant("2026-10-14", "23:10", "01:20", "2026-10-12"), instant("2026-10-15", "01:20"));
  });
});
