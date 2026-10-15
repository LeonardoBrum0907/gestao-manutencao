import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mcpDue, mcpDueChange } from "./due";

describe("prazo vindo da IA", () => {
  it("dia sozinho vale o dia; com horário vale a hora", () => {
    assert.deepEqual(mcpDue("2026-10-16"), { dueAt: "2026-10-16T12:00:00-03:00", dueHasTime: false });
    assert.deepEqual(mcpDue("2026-10-16T14:30:00-03:00"), { dueAt: "2026-10-16T14:30:00-03:00", dueHasTime: true });
  });

  it("sem mudança não mexe; null limpa", () => {
    assert.deepEqual(mcpDueChange(undefined), {});
    assert.deepEqual(mcpDueChange(null), { dueAt: null, dueHasTime: false });
  });
});
