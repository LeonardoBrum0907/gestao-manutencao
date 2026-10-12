import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { flowByWeek } from "./flow";

describe("entraram × concluídas", () => {
  it("conta cada lado na sua semana, com zero onde não houve nada", () => {
    const created = [new Date("2026-10-06T12:00:00.000Z"), new Date("2026-10-13T12:00:00.000Z")];
    const completed = [new Date("2026-10-14T12:00:00.000Z")];
    assert.deepEqual(flowByWeek(created, completed, ["2026-09-28", "2026-10-05", "2026-10-12"]), [
      { weekStart: "2026-09-28", created: 0, completed: 0 },
      { weekStart: "2026-10-05", created: 1, completed: 0 },
      { weekStart: "2026-10-12", created: 1, completed: 1 },
    ]);
  });
});
