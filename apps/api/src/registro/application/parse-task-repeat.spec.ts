import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { parseRepeatChange } from "./parse-task-repeat";

describe("ficha: regra de repetição", () => {
  it("sem o campo mantém a regra (o MCP não manda)", () => {
    assert.equal(parseRepeatChange({ body: "x" }, "task"), undefined);
  });

  it("null tira a repetição", () => {
    assert.equal(parseRepeatChange({ repeat: null }, "task"), null);
  });

  it("lê a regra da tarefa", () => {
    assert.deepEqual(parseRepeatChange({ repeat: { every: "month", dayOfMonth: 10 } }, "task"), { every: "month", dayOfMonth: 10 });
  });

  it("registro que não é tarefa sai sem regra", () => {
    assert.equal(parseRepeatChange({ repeat: { every: "day" } }, "problem"), null);
  });

  it("regra inválida explica o formato e mostra o que veio", () => {
    assert.throws(
      () => parseRepeatChange({ repeat: { every: "year" } }, "task"),
      (error: unknown) => error instanceof DomainError && error.message.includes('"every":"year"') && error.message.includes("dayOfMonth"),
    );
  });
});
