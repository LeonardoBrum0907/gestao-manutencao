import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { completedAtFor, parseDueDate, readPdiItem } from "./pdi-item";

const invalid = (error: unknown) => error instanceof DomainError && error.code === "invalid";

describe("item do PDI", () => {
  it("cria só com a ação e apara espaços", () => {
    assert.deepEqual(readPdiItem({ title: "  Treinar troca de bobina " }, false), { title: "Treinar troca de bobina" });
  });

  it("exige a ação na criação, mas não na alteração", () => {
    assert.throws(() => readPdiItem({}, false), invalid);
    assert.throws(() => readPdiItem({ title: "  " }, true), invalid);
    assert.deepEqual(readPdiItem({ status: "in_progress" }, true), { status: "in_progress" });
  });

  it("limpa referências e prazo mandados como nulos", () => {
    assert.deepEqual(readPdiItem({ lineId: null, dueDate: "" }, true), { lineId: null, dueDate: null });
  });

  it("recusa status desconhecido e texto grande demais", () => {
    assert.throws(() => readPdiItem({ status: "feito" }, true), invalid);
    assert.throws(() => readPdiItem({ title: "x".repeat(201) }, false), invalid);
    assert.throws(() => readPdiItem({ notes: "x".repeat(1001) }, true), invalid);
  });

  it("aceita só dias que existem", () => {
    assert.equal(parseDueDate("2026-10-31"), "2026-10-31");
    assert.equal(parseDueDate(null), null);
    assert.throws(() => parseDueDate("2026-02-31"), invalid);
    assert.throws(() => parseDueDate("31/10/2026"), invalid);
  });

  it("marca a conclusão uma vez e limpa ao reabrir", () => {
    const now = new Date("2026-10-05T12:00:00Z");
    const before = new Date("2026-09-01T12:00:00Z");
    assert.equal(completedAtFor("done", null, now), now);
    assert.equal(completedAtFor("done", before, now), before);
    assert.equal(completedAtFor("in_progress", before, now), null);
  });
});
