import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyRpValues } from "./rp";
import { tagLineConflict, withMachineFromTag } from "./rp-machine-tag";

const lines = [
  { id: "cam01", factoryId: "f1" },
  { id: "cam05", factoryId: "f2" },
];
const machines = [
  { id: "bli01", lineId: "cam01", tag: "EBS-BLI-01" },
  { id: "enc05", lineId: "cam05", tag: "EBS-ENC-05" },
  { id: "sem-tag", lineId: "cam01", tag: null },
];

describe("máquina do RP colado pela TAG", () => {
  it("escolhe a máquina da TAG na linha reconhecida, sem ligar para caixa e espaços", () => {
    const values = withMachineFromTag({ ...emptyRpValues(), lineId: "cam01", factoryId: "f1", tag: " ebs-bli- 01 " }, machines, lines);
    assert.equal(values.machineId, "bli01");
  });

  it("sem linha reconhecida, traz também a linha e a fábrica da máquina", () => {
    const values = withMachineFromTag({ ...emptyRpValues(), tag: "EBS-ENC-05" }, machines, lines);
    assert.deepEqual([values.machineId, values.lineId, values.factoryId], ["enc05", "cam05", "f2"]);
  });

  it("não troca nada quando a TAG é de máquina de outra linha, repetida, desconhecida ou já há máquina", () => {
    const otherLine = { ...emptyRpValues(), lineId: "cam01", tag: "EBS-ENC-05" };
    assert.deepEqual(withMachineFromTag(otherLine, machines, lines), otherLine);
    const twice = [...machines, { id: "bli01b", lineId: "cam01", tag: "EBS-BLI-01" }];
    assert.equal(withMachineFromTag({ ...emptyRpValues(), tag: "EBS-BLI-01" }, twice, lines).machineId, "");
    assert.equal(withMachineFromTag({ ...emptyRpValues(), tag: "XYZ" }, machines, lines).machineId, "");
    assert.equal(withMachineFromTag({ ...emptyRpValues(), tag: "EBS-BLI-01", machineId: "outra" }, machines, lines).machineId, "outra");
  });

  // TAGs como vieram nos RPs de produção (2026-11-19).
  it("acha a máquina com ponto no fim, espaço no lugar do traço ou sem o zero", () => {
    const tags = ["EBS-BLI-01.", "EBS BLI 01", "ebs-bli-1", "EBSBLI01"];
    const found = tags.map((tag) => withMachineFromTag({ ...emptyRpValues(), tag }, machines, lines).machineId);
    assert.deepEqual(found, ["bli01", "bli01", "bli01", "bli01"]);
  });
});

const namedLines = [
  { id: "cam01", name: "CAM 01" },
  { id: "cam05", name: "CAM 05" },
];
const namedMachines = machines.map((machine) => ({ ...machine, name: machine.id === "bli01" ? "Blistadeira" : "Encartuchadeira" }));

describe("aviso de TAG de outra linha", () => {
  it("avisa quando a TAG é de uma máquina de outra linha", () => {
    const values = { ...emptyRpValues(), lineId: "cam05", tag: "EBS-BLI-01" };
    assert.equal(tagLineConflict(values, namedMachines, namedLines), "A TAG EBS-BLI-01 é da Blistadeira da CAM 01, mas a linha lida foi CAM 05. Confira a linha e a máquina.");
  });

  it("não avisa com máquina escolhida, sem linha, TAG da mesma linha ou TAG desconhecida", () => {
    const base = { ...emptyRpValues(), lineId: "cam05", tag: "EBS-BLI-01" };
    const quiet = [{ ...base, machineId: "enc05" }, { ...base, lineId: "" }, { ...base, tag: "EBS-ENC-05" }, { ...base, tag: "XYZ" }];
    assert.deepEqual(quiet.map((values) => tagLineConflict(values, namedMachines, namedLines)), [null, null, null, null]);
  });
});
