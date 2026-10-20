import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ChamadoRow, LineRow } from "../infra/overview-read.prisma";
import { chamadoFacts, factoryScope, failureFacts, lineInScope, machineLabel, openChamadoList, rpInScope } from "./overview-facts";

const lines: LineRow[] = [
  { id: "cam05", name: "CAM 05", factoryId: "f2", status: "released" },
  { id: "med02", name: "MED 02", factoryId: "f3", status: "stopped" },
];
const lineNames = new Map(lines.map((line) => [line.id, line.name]));
const encartuchadeira = { name: "Encartuchadeira", line: { name: "CAM 05" } };

function chamado(partial: Partial<ChamadoRow>): ChamadoRow {
  return {
    id: "c1",
    dayNumber: 1,
    body: "Esteira de saída travando",
    status: "open",
    lineId: "cam05",
    lineLabel: null,
    openedAt: null,
    occurredAt: new Date("2026-10-12T10:00:00.000Z"),
    durationMin: null,
    machineId: null,
    machine: null,
    ...partial,
  };
}

describe("filtro de fábrica do dashboard", () => {
  it("sem fábrica tudo passa, inclusive sem linha", () => {
    const scope = factoryScope(lines, null);
    assert.equal(lineInScope(scope, null), true);
    assert.equal(rpInScope(scope, { factoryId: "f3" }), true);
  });

  it("com fábrica só as linhas dela; sem linha fica de fora", () => {
    const scope = factoryScope(lines, "f2");
    assert.equal(lineInScope(scope, "cam05"), true);
    assert.equal(lineInScope(scope, "med02"), false);
    assert.equal(lineInScope(scope, null), false);
    assert.equal(rpInScope(scope, { factoryId: "f3" }), false);
  });
});

describe("chamados para o dashboard", () => {
  it("lista só os não liberados, do aberto há mais tempo primeiro", () => {
    const rows = [
      chamado({ id: "novo", openedAt: new Date("2026-10-12T14:00:00.000Z"), machine: encartuchadeira }),
      chamado({ id: "liberado", status: "done" }),
      chamado({ id: "antigo", openedAt: new Date("2026-10-12T08:00:00.000Z"), lineId: null }),
    ];
    const list = openChamadoList(rows, lineNames);
    assert.deepEqual(list.map((item) => item.id), ["antigo", "novo"]);
    assert.equal(list[1].lineName, "CAM 05");
    assert.equal(list[1].machineName, "Encartuchadeira");
    assert.equal(list[0].lineName, null);
  });

  it("chamado com linha fora do cadastro mostra a linha escrita, não \"Sem linha\"", () => {
    const list = openChamadoList([chamado({ lineId: null, lineLabel: "Utilidades" })], lineNames);
    assert.equal(list[0].lineName, "Utilidades");
  });

  it("sem hora de abertura usa a data do chamado", () => {
    assert.equal(openChamadoList([chamado({})], lineNames)[0].openedAt, "2026-10-12T10:00:00.000Z");
  });

  it("separa o período pelo dia do chamado, com início incluído e fim excluído", () => {
    const rows = [
      chamado({ id: "a", occurredAt: new Date("2026-10-01T00:00:00.000Z") }),
      chamado({ id: "b", occurredAt: new Date("2026-10-08T00:00:00.000Z") }),
    ];
    const facts = chamadoFacts(rows, lineNames, new Date("2026-10-01T00:00:00.000Z"), new Date("2026-10-08T00:00:00.000Z"));
    assert.equal(facts.length, 1);
    assert.equal(facts[0].lineName, "CAM 05");
  });
});

describe("falhas por máquina", () => {
  it("junta chamados, RPs e problemas com máquina e ignora os sem máquina", () => {
    const facts = failureFacts(
      [{ machineId: "m1", machine: encartuchadeira }, { machineId: null, machine: null }],
      [{ machineId: "m1", machine: encartuchadeira, subassembly: { name: "Esteira de saída" } }],
    );
    assert.deepEqual(facts, [
      { machineId: "m1", machineLabel: "Encartuchadeira CAM 05", subassembly: null },
      { machineId: "m1", machineLabel: "Encartuchadeira CAM 05", subassembly: "Esteira de saída" },
    ]);
  });

  it("nome da máquina vem com a linha", () => {
    assert.equal(machineLabel(encartuchadeira), "Encartuchadeira CAM 05");
    assert.equal(machineLabel(null), null);
  });
});
