import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BoardItemDto } from "@manutencao/shared";
import { addDays, agendaDayTitle, agendaLists, agendaMonth, agendaWeek, dayKey, dayOfKey } from "./agenda";

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

const today = "2026-10-13";

describe("dias da Agenda", () => {
  it("soma dias atravessando o mês", () => {
    assert.equal(addDays("2026-10-30", 3), "2026-11-02");
    assert.equal(addDays("2026-10-13", -1), "2026-10-12");
  });

  it("a semana tem 7 dias a partir do primeiro", () => {
    const week = agendaWeek(today);
    assert.equal(week.length, 7);
    assert.equal(week[0], "2026-10-13");
    assert.equal(week[6], "2026-10-19");
  });

  it("a chave da lista guarda o dia", () => {
    assert.equal(dayOfKey(dayKey("2026-10-16")), "2026-10-16");
    assert.equal(dayOfKey("sem-prazo"), null);
  });
});

describe("listas da Agenda", () => {
  const items = [
    task("atrasada", { group: "overdue", dueAt: "2026-10-10T15:00:00.000Z" }),
    task("hoje", { group: "today", dueAt: "2026-10-13T18:00:00.000Z" }),
    // 15/10 às 22h em São Paulo (01h UTC do dia 16): fica no dia 15.
    task("noite", { group: "upcoming", dueAt: "2026-10-16T01:00:00.000Z" }),
    task("longe", { group: "upcoming", dueAt: "2026-11-20T15:00:00.000Z" }),
    task("solta", { group: "undated" }),
    task("feita", { group: "done", status: "done", dueAt: "2026-10-13T15:00:00.000Z" }),
  ];

  it("põe cada tarefa aberta no seu dia, atrasadas e sem prazo à parte", () => {
    const lists = agendaLists(items, agendaWeek(today), today);
    assert.deepEqual(lists.atrasadas, ["atrasada"]);
    assert.deepEqual(lists[dayKey("2026-10-13")], ["hoje"]);
    assert.deepEqual(lists[dayKey("2026-10-15")], ["noite"]);
    assert.deepEqual(lists["sem-prazo"], ["solta"]);
    assert.equal(Object.values(lists).flat().includes("longe"), false);
    assert.equal(Object.values(lists).flat().includes("feita"), false);
  });

  it("em outra semana não há lista de atrasadas", () => {
    const lists = agendaLists(items, agendaWeek("2026-10-20"), today);
    assert.equal(lists.atrasadas, undefined);
  });
});

describe("títulos da Agenda", () => {
  it("diz Hoje, Amanhã ou o dia da semana", () => {
    assert.deepEqual(agendaDayTitle("2026-10-13", today), { date: "13 out", name: "Hoje" });
    assert.deepEqual(agendaDayTitle("2026-10-14", today), { date: "14 out", name: "Amanhã" });
    assert.deepEqual(agendaDayTitle("2026-10-15", today), { date: "15 out", name: "Quinta-feira" });
  });

  it("mostra o mês, ou os dois quando a semana vira o mês", () => {
    assert.equal(agendaMonth(agendaWeek(today)), "Outubro de 2026");
    assert.equal(agendaMonth(agendaWeek("2026-10-29")), "Outubro – novembro de 2026");
  });
});
