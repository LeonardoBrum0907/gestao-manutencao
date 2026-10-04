import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRecordPanel, type PanelRecord } from "./panel";

const now = new Date("2026-09-30T15:00:00.000Z");

function record(partial: Partial<PanelRecord> & Pick<PanelRecord, "id" | "type">): PanelRecord {
  return {
    status: "open",
    dueAt: null,
    body: partial.id,
    occurredAt: now,
    createdAt: now,
    machineId: null,
    memberId: null,
    ...partial,
  };
}

describe("painel", () => {
  it("usa os mesmos filtros da lista de acompanhamento", () => {
    const panel = buildRecordPanel(
      [
        record({ id: "aberta", type: "task", dueAt: new Date("2026-10-07T03:00:00.000Z"), machineId: "m1", memberId: "t1" }),
        record({ id: "vencida", type: "task", dueAt: new Date("2026-09-29T15:00:00.000Z"), machineId: "m1", memberId: "t1" }),
        record({ id: "hoje", type: "task", status: "in_progress", dueAt: new Date("2026-10-01T02:30:00.000Z") }),
        record({ id: "feita", type: "problem", status: "done" }),
        record({ id: "concluida-atrasada", type: "task", status: "done", dueAt: new Date("2026-09-29T15:00:00.000Z") }),
        record({ id: "problema-com-data", type: "problem", dueAt: new Date("2026-09-29T15:00:00.000Z") }),
      ],
      {
        machines: new Map([["m1", "MED 02"]]),
        members: new Map([["t1", "AMILTON NASCIMENTO"]]),
      },
      now,
    );
    assert.equal(panel.openCount, 3);
    assert.equal(panel.overdueCount, 1);
    assert.equal(panel.dueTodayCount, 1);
    assert.equal(panel.doneCount, 2);
    assert.deepEqual(panel.machineRanking, [{ id: "m1", name: "MED 02", openCount: 2 }]);
    assert.deepEqual(panel.memberRanking, [{ id: "t1", name: "AMILTON NASCIMENTO", openCount: 2 }]);
  });

  it("ordena os últimos pela gravação e limita o ranking", () => {
    const records = Array.from({ length: 6 }, (_, index) =>
      record({
        id: `r${index}`,
        type: "task",
        createdAt: new Date(Date.UTC(2026, 8, index + 1)),
        machineId: "m1",
      }),
    );
    const panel = buildRecordPanel(records, { machines: new Map([["m1", "CAM"]]), members: new Map() }, now);
    assert.deepEqual(
      panel.recent.map((item) => item.id),
      ["r5", "r4", "r3", "r2", "r1"],
    );
    assert.equal(panel.machineRanking[0]?.openCount, 6);
  });
});
