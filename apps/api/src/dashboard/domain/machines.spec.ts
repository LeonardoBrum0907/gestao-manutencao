import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chamadoTotals, fourMOf, paretoOf, repeatsOf, type ChamadoFact, type FailureFact } from "./machines";

function chamado(partial: Partial<ChamadoFact>): ChamadoFact {
  return {
    openedAt: new Date("2026-10-10T12:00:00.000Z"),
    durationMin: null,
    machineId: null,
    machineLabel: null,
    lineId: null,
    lineName: null,
    ...partial,
  };
}

const encartuchadeira = { machineId: "m1", machineLabel: "Encartuchadeira CAM 05", lineId: "l5", lineName: "CAM 05" };
const blistadeira = { machineId: "m2", machineLabel: "Blistadeira MED 02", lineId: "l2", lineName: "MED 02" };

describe("chamados do período", () => {
  it("conta todos e tira a média só dos fechados", () => {
    assert.deepEqual(chamadoTotals([chamado({ durationMin: 30 }), chamado({ durationMin: 61 }), chamado({})]), { count: 3, avgMinutes: 46 });
  });

  it("sem chamado fechado a média fica vazia", () => {
    assert.deepEqual(chamadoTotals([chamado({})]), { count: 1, avgMinutes: null });
    assert.deepEqual(chamadoTotals([]), { count: 0, avgMinutes: null });
  });
});

describe("Pareto de chamados", () => {
  it("ordena por quantidade e soma os minutos", () => {
    const rows = [
      chamado({ ...blistadeira, durationMin: 20 }),
      chamado({ ...encartuchadeira, durationMin: 50 }),
      chamado({ ...encartuchadeira, durationMin: null }),
    ];
    assert.deepEqual(paretoOf(rows), [
      { key: "m1", label: "Encartuchadeira CAM 05", count: 2, minutes: 50 },
      { key: "m2", label: "Blistadeira MED 02", count: 1, minutes: 20 },
    ]);
  });

  it("chamado sem máquina conta na linha; sem linha fica de fora", () => {
    const rows = [chamado({ lineId: "l9", lineName: "UHLMANN 03" }), chamado({})];
    assert.deepEqual(paretoOf(rows), [{ key: "line:l9", label: "UHLMANN 03", count: 1, minutes: 0 }]);
  });

  it("empate em quantidade: mais minutos primeiro, e corta no limite", () => {
    const rows = [chamado({ ...blistadeira, durationMin: 10 }), chamado({ ...encartuchadeira, durationMin: 90 })];
    assert.deepEqual(paretoOf(rows, 1).map((item) => item.key), ["m1"]);
  });
});

describe("reincidência", () => {
  const fact = (machineId: string, subassembly: string | null): FailureFact => ({
    machineId,
    machineLabel: machineId === "m1" ? "Encartuchadeira CAM 05" : "Blistadeira MED 02",
    subassembly,
  });

  it("só máquina com 2 ou mais falhas, com o subconjunto mais citado", () => {
    const facts = [fact("m1", "Esteira de saída"), fact("m1", null), fact("m1", "Esteira de saída"), fact("m1", "Cola"), fact("m2", "Desbobinador")];
    assert.deepEqual(repeatsOf(facts), [{ machineId: "m1", label: "Encartuchadeira CAM 05", subassembly: "Esteira de saída", count: 4 }]);
  });

  it("sem subconjunto citado fica vazio", () => {
    assert.equal(repeatsOf([fact("m2", null), fact("m2", null)])[0].subassembly, null);
  });
});

describe("4M das RPs", () => {
  it("conta cada M separado", () => {
    const rps = [
      { material: true, machine: true, method: false, labor: false },
      { material: false, machine: true, method: false, labor: true },
    ];
    assert.deepEqual(fourMOf(rps), { rps: 2, material: 1, machine: 2, method: 0, labor: 1 });
  });
});
