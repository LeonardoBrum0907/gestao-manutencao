import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { describeError, LogErrorReporter } from "./log-error-reporter";

describe("LogErrorReporter", () => {
  it("grava uma linha JSON com rota, nome, mensagem e stack", () => {
    const lines: string[] = [];
    new LogErrorReporter((line) => lines.push(line)).report(new RangeError("fora"), { method: "GET", route: "/api/x" });
    const line = JSON.parse(lines[0] ?? "{}");
    assert.deepEqual([line.event, line.method, line.route, line.name, line.message], ["unexpected_error", "GET", "/api/x", "RangeError", "fora"]);
    assert.match(line.stack, /RangeError: fora/);
    assert.match(line.time, /^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("describeError", () => {
  it("aceita o que não é Error", () => {
    assert.deepEqual(describeError("caiu"), { name: "NonError", message: "caiu", stack: null });
  });

  it("tira o código do link público da mensagem", () => {
    assert.equal(describeError(new Error("falhou em /rp/abrir/abc")).message, "falhou em /rp/abrir/:code");
  });
});
