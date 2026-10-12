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
  const none = { version: null, machine: null };

  it("sem versão nem máquina vale no modelo todo", () => {
    assert.deepEqual(subassemblyPlace("blis", { versionId: null, machineId: null }, none), { versionId: null, machineId: null });
  });

  it("aceita versão e máquina do mesmo modelo", () => {
    const version = { equipmentId: "blis", archived: false };
    assert.deepEqual(subassemblyPlace("blis", { versionId: "m092", machineId: null }, { version, machine: null }), { versionId: "m092", machineId: null });
    assert.deepEqual(subassemblyPlace("blis", { versionId: null, machineId: "m1" }, { version: null, machine: { equipmentId: "blis" } }), {
      versionId: null,
      machineId: "m1",
    });
  });

  it("recusa versão e máquina juntas", () => {
    refusedSaying(
      () => subassemblyPlace("blis", { versionId: "m092", machineId: "m1" }, none),
      "O subconjunto vale para uma versão ou para uma máquina, não para as duas.",
    );
  });

  it("recusa versão de outro modelo, arquivada ou que não existe", () => {
    refusedSaying(() => subassemblyPlace("blis", { versionId: "x", machineId: null }, none), "Versão não encontrada (id x).");
    refusedSaying(
      () => subassemblyPlace("blis", { versionId: "x", machineId: null }, { version: { equipmentId: "enc", archived: false }, machine: null }),
      "Esta versão é de outro modelo de equipamento.",
    );
    refusedSaying(
      () => subassemblyPlace("blis", { versionId: "x", machineId: null }, { version: { equipmentId: "blis", archived: true }, machine: null }),
      "Esta versão está arquivada.",
    );
  });

  it("recusa máquina de outro modelo", () => {
    refusedSaying(
      () => subassemblyPlace("blis", { versionId: null, machineId: "m1" }, { version: null, machine: { equipmentId: null } }),
      "Esta máquina é de outro modelo de equipamento.",
    );
  });
});
