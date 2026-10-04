import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "./domain-error";
import { requireOrder } from "./order";

describe("ordem de cadastro", () => {
  it("aceita todos os itens, uma vez cada, na ordem nova", () => {
    assert.deepEqual(requireOrder(["b", "a"], ["a", "b"]), ["b", "a"]);
  });

  it("recusa faltando, repetido, estranho ou fora de formato", () => {
    for (const ids of [["a"], ["a", "a"], ["a", "c"], "a,b", [1, 2]]) {
      assert.throws(() => requireOrder(ids, ["a", "b"]), (error: unknown) => error instanceof DomainError && error.statusCode === 400);
    }
  });
});
