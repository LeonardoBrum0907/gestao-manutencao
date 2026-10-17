import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyRpValues } from "./rp";
import { withMachineFromTag } from "./rp-machine-tag";

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
});
