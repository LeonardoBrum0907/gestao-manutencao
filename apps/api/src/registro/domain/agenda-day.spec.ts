import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { dueAtOnDay, parseDueDay } from "./agenda-day";

describe("dia da Agenda", () => {
  it("aceita AAAA-MM-DD de um dia que existe", () => {
    assert.equal(parseDueDay("2026-10-16"), "2026-10-16");
  });

  it("recusa formato errado e dia que não existe", () => {
    assert.throws(() => parseDueDay("16/10/2026"), DomainError);
    assert.throws(() => parseDueDay("2026-02-30"), DomainError);
    assert.throws(() => parseDueDay(20261016), DomainError);
  });
});

describe("prazo ao levar para outro dia", () => {
  it("mantém o horário que a tarefa tinha, no fuso do gestor", () => {
    // 13/10 às 15h em São Paulo vai para 16/10 às 15h.
    const due = dueAtOnDay("2026-10-16", new Date("2026-10-13T18:00:00.000Z"));
    assert.equal(due.toISOString(), "2026-10-16T18:00:00.000Z");
  });

  it("horário da noite não troca de dia por causa do UTC", () => {
    // 13/10 às 22h em São Paulo (01h UTC do dia 14).
    const due = dueAtOnDay("2026-10-20", new Date("2026-10-14T01:00:00.000Z"));
    assert.equal(due.toISOString(), "2026-10-21T01:00:00.000Z");
  });

  it("tarefa sem prazo fica ao meio-dia", () => {
    assert.equal(dueAtOnDay("2026-10-16", null).toISOString(), "2026-10-16T15:00:00.000Z");
  });
});
