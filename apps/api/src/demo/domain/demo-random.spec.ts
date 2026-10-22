import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { demoRandom } from "./demo-random";

describe("sorteio da demonstração", () => {
  it("repete a mesma sequência para a mesma semente", () => {
    const first = demoRandom(42);
    const second = demoRandom(42);
    assert.deepEqual(
      Array.from({ length: 5 }, () => first.int(0, 100)),
      Array.from({ length: 5 }, () => second.int(0, 100)),
    );
  });

  it("fica dentro dos limites, com os dois inclusos", () => {
    const random = demoRandom(1);
    const values = new Set(Array.from({ length: 500 }, () => random.int(2, 4)));
    assert.deepEqual([...values].sort(), [2, 3, 4]);
  });

  it("recusa sortear de uma lista vazia, dizendo o que esperava", () => {
    assert.throws(() => demoRandom(1).pick([]), /lista vazia/);
  });
});
