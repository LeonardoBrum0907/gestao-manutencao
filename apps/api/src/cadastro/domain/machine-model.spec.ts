import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertHideable, assertModelChangeAllowed } from "./machine-model";

function refusedSaying(run: () => void, message: string) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.message, message);
    return true;
  });
}

describe("troca de modelo da máquina", () => {
  it("permite sem subconjunto próprio ou sem troca", () => {
    assert.doesNotThrow(() => assertModelChangeAllowed("blis", "enc", 0));
    assert.doesNotThrow(() => assertModelChangeAllowed("blis", "blis", 3));
  });

  it("recusa com subconjunto próprio", () => {
    refusedSaying(() => assertModelChangeAllowed("blis", "enc", 2), "Esta máquina tem 2 subconjuntos próprios; exclua ou arquive antes de trocar o modelo.");
  });
});

describe("subconjuntos desmarcados na máquina", () => {
  const machine = { id: "m1", equipmentId: "blis", hiddenSubassemblyIds: [] };
  const all = new Map([
    ["s1", { equipmentId: "blis", machineId: null }],
    ["s2", { equipmentId: "blis", machineId: "m2" }],
  ]);

  it("aceita desmarcar um do modelo", () => {
    assert.doesNotThrow(() => assertHideable(machine, ["s1"], all));
  });

  it("recusa um só de outra máquina ou que não existe", () => {
    refusedSaying(() => assertHideable(machine, ["s2"], all), "O subconjunto s2 não é desta máquina; só dá para desmarcar os do modelo ou dela.");
    refusedSaying(() => assertHideable(machine, ["s9"], all), "Subconjunto não encontrado (id s9).");
  });
});
