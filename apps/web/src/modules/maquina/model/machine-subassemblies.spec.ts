import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubassemblyDto } from "@manutencao/shared";
import { machineSubassemblyGroups, toggledHidden } from "./machine-subassemblies";

function sub(id: string, scope: Partial<SubassemblyDto> = {}): SubassemblyDto {
  return { id, equipmentId: "blis", machineId: null, name: id, archived: false, ...scope };
}

describe("subconjuntos na tela da máquina", () => {
  const machine = { id: "m1", equipmentId: "blis", hiddenSubassemblyIds: ["desmarcado"] };
  const all = [
    sub("modelo"),
    sub("desmarcado"),
    sub("arquivado", { archived: true }),
    sub("so-m1", { machineId: "m1" }),
    sub("so-m2", { machineId: "m2" }),
  ];

  it("separa do modelo e só da máquina, mantendo os desmarcados e tirando os arquivados", () => {
    const groups = machineSubassemblyGroups(all, machine);
    assert.deepEqual(groups.model.map((item) => item.id), ["modelo", "desmarcado"]);
    assert.deepEqual(groups.own.map((item) => item.id), ["so-m1"]);
  });
});

describe("marcar e desmarcar", () => {
  it("desmarcar acrescenta e marcar tira da lista", () => {
    assert.deepEqual(toggledHidden(["s1"], "s2", false), ["s1", "s2"]);
    assert.deepEqual(toggledHidden(["s1", "s2"], "s1", true), ["s2"]);
  });

  it("não repete quem já estava desmarcado", () => {
    assert.deepEqual(toggledHidden(["s1"], "s1", false), ["s1"]);
  });
});
