import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  initialOpenEquipment,
  readCollapsedSubgroups,
  readOpenEquipment,
  saveOpenEquipment,
  subgroupFoldKey,
  toggleCollapsedSubgroup,
} from "./matrix-fold";

class FakeMatrixFoldStorage {
  items = new Map<string, string>();
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

class BlockedMatrixFoldStorage {
  getItem(): string | null {
    throw new Error("bloqueado");
  }
  setItem(): void {
    throw new Error("bloqueado");
  }
}

const DESBOBINADOR = subgroupFoldKey("eq1", "Desbobinador");

describe("subconjuntos recolhidos no aparelho", () => {
  it("sem nada guardado, todos abertos", () => {
    assert.equal(readCollapsedSubgroups(new FakeMatrixFoldStorage()).size, 0);
    assert.equal(readCollapsedSubgroups(null).size, 0);
  });

  it("recolher guarda e vale na próxima visita", () => {
    const storage = new FakeMatrixFoldStorage();
    toggleCollapsedSubgroup(storage, new Set(), DESBOBINADOR);
    assert.ok(readCollapsedSubgroups(storage).has(DESBOBINADOR));
  });

  it("abrir de novo tira da lista guardada", () => {
    const storage = new FakeMatrixFoldStorage();
    const collapsed = toggleCollapsedSubgroup(storage, new Set(), DESBOBINADOR);
    toggleCollapsedSubgroup(storage, collapsed, DESBOBINADOR);
    assert.equal(readCollapsedSubgroups(storage).size, 0);
  });

  it("mesmo nome em outro equipamento é outro subconjunto", () => {
    const storage = new FakeMatrixFoldStorage();
    toggleCollapsedSubgroup(storage, new Set(), DESBOBINADOR);
    assert.equal(readCollapsedSubgroups(storage).has(subgroupFoldKey("eq2", "Desbobinador")), false);
  });

  it("guardado estragado volta todos abertos", () => {
    const storage = new FakeMatrixFoldStorage();
    storage.items.set("matriz.subconjuntos-recolhidos", "{não é json");
    assert.equal(readCollapsedSubgroups(storage).size, 0);
    storage.items.set("matriz.subconjuntos-recolhidos", JSON.stringify([DESBOBINADOR, 3]));
    assert.deepEqual([...readCollapsedSubgroups(storage)], [DESBOBINADOR]);
  });

  it("navegador bloqueado ainda recolhe nesta visita", () => {
    const storage = new BlockedMatrixFoldStorage();
    assert.ok(toggleCollapsedSubgroup(storage, new Set(), DESBOBINADOR).has(DESBOBINADOR));
    assert.equal(readCollapsedSubgroups(storage).size, 0);
  });
});

describe("equipamento aberto no aparelho", () => {
  it("nunca escolhido abre o primeiro, como antes", () => {
    const stored = readOpenEquipment(new FakeMatrixFoldStorage());
    assert.equal(stored, undefined);
    assert.equal(initialOpenEquipment(["eq1", "eq2"], null, stored), "eq1");
  });

  it("abre o guardado", () => {
    const storage = new FakeMatrixFoldStorage();
    saveOpenEquipment(storage, "eq2");
    assert.equal(initialOpenEquipment(["eq1", "eq2"], null, readOpenEquipment(storage)), "eq2");
  });

  it("todos fechados continuam fechados", () => {
    const storage = new FakeMatrixFoldStorage();
    saveOpenEquipment(storage, null);
    assert.equal(initialOpenEquipment(["eq1", "eq2"], null, readOpenEquipment(storage)), null);
  });

  it("guardado que o colaborador não tem abre o primeiro dele", () => {
    assert.equal(initialOpenEquipment(["eq1"], null, "eq9"), "eq1");
    assert.equal(initialOpenEquipment([], null, "eq9"), null);
  });

  it("o link da Matriz da equipe manda mais que o guardado", () => {
    assert.equal(initialOpenEquipment(["eq1", "eq2"], "eq2", null), "eq2");
    assert.equal(initialOpenEquipment(["eq1", "eq2"], "eq9", "eq1"), "eq1");
  });

  it("guardado estragado conta como nunca escolhido", () => {
    const storage = new FakeMatrixFoldStorage();
    storage.items.set("matriz.equipamento-aberto", "42");
    assert.equal(readOpenEquipment(storage), undefined);
    assert.equal(readOpenEquipment(new BlockedMatrixFoldStorage()), undefined);
  });
});
