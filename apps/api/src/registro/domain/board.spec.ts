import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertBoardChange, boardDueAt, boardGroup, compareBoard, parseBoardChange, type BoardSortable } from "./board";

// 30/09 às 12h em São Paulo.
const now = new Date("2026-09-30T15:00:00.000Z");

describe("grupos do checklist", () => {
  it("separa atrasada, hoje, próximos dias, sem prazo e concluída", () => {
    assert.equal(boardGroup({ status: "open", dueAt: new Date("2026-09-29T15:00:00.000Z") }, now), "overdue");
    assert.equal(boardGroup({ status: "in_progress", dueAt: new Date("2026-09-30T23:00:00.000Z") }, now), "today");
    assert.equal(boardGroup({ status: "open", dueAt: new Date("2026-10-01T15:00:00.000Z") }, now), "upcoming");
    assert.equal(boardGroup({ status: "open", dueAt: new Date("2026-10-20T15:00:00.000Z") }, now), "upcoming");
    assert.equal(boardGroup({ status: "open", dueAt: null }, now), "undated");
    assert.equal(boardGroup({ status: "done", dueAt: new Date("2026-09-01T15:00:00.000Z") }, now), "done");
  });

  it("vira o dia em São Paulo, não em UTC", () => {
    // 01/10 às 02h UTC ainda é 30/09 em São Paulo.
    assert.equal(boardGroup({ status: "open", dueAt: new Date("2026-10-01T02:00:00.000Z") }, now), "today");
  });
});

describe("prazo ao arrastar", () => {
  it("Hoje e Próximos dias marcam meio-dia de hoje e de amanhã no fuso do gestor", () => {
    assert.equal(boardDueAt("today", now)?.toISOString(), "2026-09-30T15:00:00.000Z");
    assert.equal(boardDueAt("upcoming", now)?.toISOString(), "2026-10-01T15:00:00.000Z");
    assert.equal(boardDueAt("undated", now), null);
  });

  it("à noite em São Paulo, hoje ainda é o dia local", () => {
    const lateNight = new Date("2026-10-01T02:30:00.000Z");
    assert.equal(boardDueAt("today", lateNight)?.toISOString(), "2026-09-30T15:00:00.000Z");
  });
});

describe("ordem dentro do grupo", () => {
  function item(id: string, partial: Partial<BoardSortable> = {}): BoardSortable {
    return { id, boardPosition: null, dueAt: null, occurredAt: new Date("2026-09-01T12:00:00.000Z"), ...partial };
  }

  it("o que foi arrastado vem antes, na ordem guardada; o resto segue o prazo e depois o mais recente", () => {
    const list = [
      item("sem-prazo-antigo"),
      item("sem-prazo-novo", { occurredAt: new Date("2026-09-20T12:00:00.000Z") }),
      item("prazo-tarde", { dueAt: new Date("2026-10-05T15:00:00.000Z") }),
      item("prazo-cedo", { dueAt: new Date("2026-10-02T15:00:00.000Z") }),
      item("arrastado-2", { boardPosition: 2 }),
      item("arrastado-0", { boardPosition: 0 }),
    ];
    assert.deepEqual(
      list.sort(compareBoard).map((entry) => entry.id),
      ["arrastado-0", "arrastado-2", "prazo-cedo", "prazo-tarde", "sem-prazo-novo", "sem-prazo-antigo"],
    );
  });
});

describe("mudança pelo checklist", () => {
  it("aceita status, grupo de destino e ordem", () => {
    assert.deepEqual(parseBoardChange("a", { status: "done" }), { status: "done", target: null, day: null, order: null });
    assert.deepEqual(parseBoardChange("a", { group: "today", order: ["b", "a"] }), { status: null, target: "today", day: null, order: ["b", "a"] });
  });

  it("aceita um dia da Agenda, mas não junto com o grupo", () => {
    assert.deepEqual(parseBoardChange("a", { day: "2026-10-16", order: ["a"] }), { status: null, target: null, day: "2026-10-16", order: ["a"] });
    assert.throws(() => parseBoardChange("a", { group: "today", day: "2026-10-16" }), DomainError);
    assert.throws(() => parseBoardChange("a", { day: "amanhã" }), DomainError);
  });

  it("recusa levar para Atrasadas ou Concluídas, ordem sem o item e pedido vazio", () => {
    assert.throws(() => parseBoardChange("a", { group: "overdue" }), DomainError);
    assert.throws(() => parseBoardChange("a", { group: "done" }), DomainError);
    assert.throws(() => parseBoardChange("a", { order: ["b"] }), DomainError);
    assert.throws(() => parseBoardChange("a", { order: ["a", "a"] }), DomainError);
    assert.throws(() => parseBoardChange("a", {}), DomainError);
    assert.throws(() => parseBoardChange("a", { status: "closed" }), DomainError);
  });

  it("só tarefa ganha prazo e problema de RP só fecha pelo RP", () => {
    const close = parseBoardChange("a", { status: "done" });
    const move = parseBoardChange("a", { group: "today", order: ["a"] });
    const reorder = parseBoardChange("a", { order: ["a"] });
    assert.throws(() => assertBoardChange({ type: "feedback", origin: "inbox" }, move), DomainError);
    assert.doesNotThrow(() => assertBoardChange({ type: "feedback", origin: "inbox" }, close));
    assert.throws(() => assertBoardChange({ type: "problem", origin: "inbox" }, move), DomainError);
    assert.throws(() => assertBoardChange({ type: "problem", origin: "rp" }, close), DomainError);
    assert.doesNotThrow(() => assertBoardChange({ type: "problem", origin: "rp" }, reorder));
    assert.doesNotThrow(() => assertBoardChange({ type: "task", origin: "inbox" }, move));
    assert.doesNotThrow(() => assertBoardChange({ type: "problem", origin: "inbox" }, close));
    assert.doesNotThrow(() => assertBoardChange({ type: "task", origin: "inbox" }, close));
    const toDay = parseBoardChange("a", { day: "2026-10-16" });
    assert.throws(() => assertBoardChange({ type: "problem", origin: "inbox" }, toDay), DomainError);
    assert.doesNotThrow(() => assertBoardChange({ type: "task", origin: "inbox" }, toDay));
  });
});
