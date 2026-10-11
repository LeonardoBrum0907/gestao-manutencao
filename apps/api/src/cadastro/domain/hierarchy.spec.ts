import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertLineCanBeRemoved, assertSubassemblyFits, assertSubassemblyNameAvailable } from "./hierarchy";

function refused(run: () => void, code: string) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, code);
    assert.equal(error.statusCode, 409);
    return true;
  });
}

function refusedSaying(run: () => void, message: string) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.message, message);
    return true;
  });
}

describe("exclusão de linha", () => {
  it("recusa quando a linha tem máquina", () => {
    refused(() => assertLineCanBeRemoved(2), "line_has_machines");
  });

  it("permite quando não há máquina", () => {
    assert.doesNotThrow(() => assertLineCanBeRemoved(0));
  });
});

describe("nome do subconjunto", () => {
  const siblings = [
    { id: "a", name: "Esteira de Saída" },
    { id: "b", name: "Magazine de Cartucho" },
  ];

  it("recusa repetido no mesmo modelo, ignorando acento e maiúsculas", () => {
    refused(() => assertSubassemblyNameAvailable("esteira de  saida", siblings, null), "subassembly_name_taken");
  });

  it("aceita o próprio nome ao editar", () => {
    assert.doesNotThrow(() => assertSubassemblyNameAvailable("Esteira de Saída", siblings, "a"));
  });

  it("aceita nome novo", () => {
    assert.doesNotThrow(() => assertSubassemblyNameAvailable("Válvulas roletes", siblings, null));
  });
});

describe("subconjunto da máquina", () => {
  const machine = { equipmentId: "encartuchadeira-cam" };
  const sub = { id: "s1", equipmentId: "encartuchadeira-cam", archived: false };

  it("aceita subconjunto do modelo da máquina", () => {
    assert.doesNotThrow(() => assertSubassemblyFits(machine, sub, null));
  });

  it("recusa subconjunto de outro modelo", () => {
    refusedSaying(() => assertSubassemblyFits(machine, { ...sub, equipmentId: "blistadeira-cam" }, null), "Este subconjunto não é do modelo desta máquina.");
  });

  it("recusa máquina sem modelo", () => {
    assert.throws(() => assertSubassemblyFits({ equipmentId: null }, sub, null), DomainError);
  });

  it("arquivado só fica se a ficha já apontava para ele", () => {
    const archived = { ...sub, archived: true };
    refusedSaying(() => assertSubassemblyFits(machine, archived, null), "Este subconjunto está arquivado.");
    assert.doesNotThrow(() => assertSubassemblyFits(machine, archived, "s1"));
  });
});
