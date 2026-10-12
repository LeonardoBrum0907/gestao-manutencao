import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertHideable, assertModelChangeAllowed, machineVersion } from "./machine-model";

function refusedSaying(run: () => void, message: string) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.message, message);
    return true;
  });
}

describe("versão da máquina", () => {
  const m092 = { id: "m092", equipmentId: "blis", archived: false };

  it("sem versão fica sem versão", () => {
    assert.equal(machineVersion("blis", null, null, null), null);
  });

  it("aceita versão do modelo da máquina", () => {
    assert.equal(machineVersion("blis", "m092", m092, null), "m092");
  });

  it("pede o modelo antes e recusa versão de outro modelo ou que não existe", () => {
    refusedSaying(() => machineVersion(null, "m092", m092, null), "Escolha o modelo de equipamento antes da versão.");
    refusedSaying(() => machineVersion("enc", "m092", m092, null), "Esta versão é de outro modelo de equipamento.");
    refusedSaying(() => machineVersion("blis", "x", null, null), "Versão não encontrada (id x).");
  });

  it("arquivada só fica se a máquina já estava nela", () => {
    const archived = { ...m092, archived: true };
    refusedSaying(() => machineVersion("blis", "m092", archived, null), "Esta versão está arquivada.");
    assert.equal(machineVersion("blis", "m092", archived, "m092"), "m092");
  });
});

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
  const machine = { id: "m1", equipmentId: "blis", versionId: "m092", hiddenSubassemblyIds: [] };
  const all = new Map([
    ["s1", { equipmentId: "blis", versionId: null, machineId: null }],
    ["s2", { equipmentId: "blis", versionId: "nmx", machineId: null }],
  ]);

  it("aceita desmarcar um do modelo", () => {
    assert.doesNotThrow(() => assertHideable(machine, ["s1"], all));
  });

  it("recusa um de outra versão ou que não existe", () => {
    refusedSaying(() => assertHideable(machine, ["s2"], all), "O subconjunto s2 não é desta máquina; só dá para desmarcar os do modelo, da versão ou dela.");
    refusedSaying(() => assertHideable(machine, ["s9"], all), "Subconjunto não encontrado (id s9).");
  });
});
