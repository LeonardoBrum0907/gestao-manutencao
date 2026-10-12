import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lightColors, type TokenReader } from "./light-tokens";

// Leitor falso no lugar do CSS: os testes rodam no Node, sem navegador.
class FakeTokenSheet {
  constructor(private readonly values: Record<string, string>) {}
  reader: TokenReader = (token) => this.values[token] ?? "";
}

describe("cores dos tokens do tema claro", () => {
  it("troca cada nome de token pelo valor do CSS", () => {
    const sheet = new FakeTokenSheet({ "--accent-soft": "#dcf3e6", "--accent-ink": "#17543a" });
    assert.deepEqual(lightColors({ fill: "--accent-soft", text: "--accent-ink" }, sheet.reader), { fill: "#dcf3e6", text: "#17543a" });
  });

  it("falha dizendo qual token faltou", () => {
    const sheet = new FakeTokenSheet({});
    assert.throws(() => lightColors({ fill: "--sem-isso" }, sheet.reader), /"--sem-isso"/);
  });
});
