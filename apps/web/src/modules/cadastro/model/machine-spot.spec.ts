import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubassemblyDto } from "@manutencao/shared";
import { subassemblyChoices, withMachineDefaults, withSubassemblyDefaults } from "./machine-spot";

function sub(id: string, scope: Partial<SubassemblyDto> = {}): SubassemblyDto {
  return { id, equipmentId: "blis", versionId: null, machineId: null, name: id, archived: false, ...scope };
}

describe("subconjuntos que a ficha da máquina pode escolher", () => {
  const all = [
    sub("modelo"),
    sub("m092", { versionId: "m092" }),
    sub("nmx", { versionId: "nmx" }),
    sub("so-m1", { machineId: "m1" }),
    sub("so-m2", { machineId: "m2" }),
    sub("arquivado", { archived: true }),
    sub("desmarcado"),
    sub("outro-modelo", { equipmentId: "enc" }),
  ];
  const machine = { id: "m1", equipmentId: "blis", versionId: "m092", hiddenSubassemblyIds: ["desmarcado"] };

  it("mostra os do modelo, da versão e da própria máquina, sem arquivados nem desmarcados", () => {
    assert.deepEqual(
      subassemblyChoices(all, machine, "").map((item) => item.id),
      ["modelo", "m092", "so-m1"],
    );
  });

  it("mantém o que a ficha já tinha, mesmo arquivado ou desmarcado", () => {
    assert.ok(subassemblyChoices(all, machine, "arquivado").some((item) => item.id === "arquivado"));
    assert.ok(subassemblyChoices(all, machine, "desmarcado").some((item) => item.id === "desmarcado"));
  });

  it("máquina sem modelo não tem subconjunto", () => {
    assert.deepEqual(subassemblyChoices(all, { ...machine, equipmentId: null }, ""), []);
    assert.deepEqual(subassemblyChoices(all, undefined, ""), []);
  });
});

describe("resposta da API antiga", () => {
  it("completa a máquina sem versão nem desmarcados", () => {
    const machine = withMachineDefaults({ id: "m1", lineId: "l1", equipmentId: "blis", name: "Blistadeira", tag: null, manufacturer: null, status: "released", notes: null });
    assert.equal(machine.versionId, null);
    assert.deepEqual(machine.hiddenSubassemblyIds, []);
  });

  it("completa o subconjunto como do modelo todo", () => {
    assert.deepEqual(withSubassemblyDefaults({ id: "s1", equipmentId: "blis", name: "Desbobinador", archived: false }), sub("s1", { name: "Desbobinador" }));
  });
});
