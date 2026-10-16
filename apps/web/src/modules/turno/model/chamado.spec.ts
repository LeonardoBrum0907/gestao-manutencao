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
});
