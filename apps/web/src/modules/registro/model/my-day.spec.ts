import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BoardItemDto } from "@manutencao/shared";
import { myDayDate, myDayGroups } from "./my-day";

function task(id: string, partial: Partial<BoardItemDto>): BoardItemDto {
  return {
    id,
    type: "task",
    body: id,
    status: "open",
    origin: "inbox",
    priority: null,
    dueAt: null,
    occurredAt: "2026-10-01T12:00:00.000Z",
    group: "undated",
    completedAt: null,
    ...partial,
  };
}

describe("Meu Dia", () => {
  const today = "2026-10-13";

  it("separa atrasadas, hoje e concluídas hoje, deixando de fora o resto", () => {
    const items = [
      task("atrasada", { group: "overdue" }),
      task("hoje", { group: "today" }),
      task("amanha", { group: "upcoming" }),
      task("sem-prazo", { group: "undated" }),
      // 13/10 às 21h em São Paulo (00h UTC do dia 14): ainda é hoje.
      task("feita-hoje", { group: "done", status: "done", completedAt: "2026-10-14T00:00:00.000Z" }),
      task("feita-ontem", { group: "done", status: "done", completedAt: "2026-10-12T15:00:00.000Z" }),
      task("feita-sem-data", { group: "done", status: "done" }),
    ];
    assert.deepEqual(myDayGroups(items, today), { overdue: ["atrasada"], today: ["hoje"], doneToday: ["feita-hoje"] });
  });

  it("escreve a data por extenso", () => {
    assert.equal(myDayDate(today), "Terça-feira, 13 de outubro");
  });
});
