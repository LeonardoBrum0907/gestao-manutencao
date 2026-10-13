import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { subassemblyPlace } from "./subassembly-place";

function refusedSaying(run: () => void, message: string) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.message, message);
    return true;
  });
}

describe("onde vale o subconjunto novo", () => {
  it("sem máquina vale no modelo todo", () => {
    assert.equal(subassemblyPlace("blis", null, null), null);
  });

  it("aceita máquina do mesmo modelo", () => {
    assert.equal(subassemblyPlace("blis", "m1", { equipmentId: "blis" }), "m1");
  });

  it("recusa máquina de outro modelo ou que não existe", () => {
    refusedSaying(() => subassemblyPlace("blis", "m1", { equipmentId: null }), "Esta máquina é de outro modelo de equipamento.");
    refusedSaying(() => subassemblyPlace("blis", "m9", null), "Máquina não encontrada (id m9).");
  });
});
