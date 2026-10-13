import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { LineDto, MachineDto } from "@manutencao/shared";
import { machinesOfModel, modelUsageText } from "./model-machines";

function line(id: string, name: string): LineDto {
  return { id, name, factoryId: "f1", sector: null, manufacturer: null, internalCode: null, status: "released", notes: null, isDailyLine: false, isCritical: false };
}

function machine(id: string, lineId: string, name: string, equipmentId: string | null): MachineDto {
  return { id, lineId, equipmentId, name, tag: null, manufacturer: null, status: "released", notes: null };
}

describe("máquinas de um modelo", () => {
  const lines = [line("l10", "CAM 10"), line("l2", "CAM 2"), line("l1", "MED 01")];

  it("lista só as máquinas do modelo, com a linha, em ordem numérica", () => {
    const machines = [
      machine("a", "l10", "Blistadeira", "blis"),
      machine("b", "l2", "Blistadeira", "blis"),
      machine("c", "l1", "Encartuchadeira", "enc"),
      machine("d", "l1", "Balança", null),
    ];
    assert.deepEqual(machinesOfModel(machines, lines, "blis"), [
      { id: "b", label: "CAM 2 · Blistadeira" },
      { id: "a", label: "CAM 10 · Blistadeira" },
    ]);
  });

  it("devolve vazio quando nenhuma máquina usa o modelo", () => {
    assert.deepEqual(machinesOfModel([machine("a", "l1", "Blistadeira", "blis")], lines, "balanca-ocs"), []);
  });
});

describe("uso do modelo na lista de modelos", () => {
  it("diz sem uso quando não há máquina nem subconjunto", () => {
    assert.equal(modelUsageText(0, 0), "sem uso");
  });

  it("avisa nenhuma máquina quando o modelo já tem subconjunto", () => {
    assert.equal(modelUsageText(0, 1), "nenhuma máquina · 1 subconjunto");
  });

  it("conta máquinas e subconjuntos no singular e no plural", () => {
    assert.equal(modelUsageText(1, 0), "1 máquina");
    assert.equal(modelUsageText(9, 15), "9 máquinas · 15 subconjuntos");
  });
});
