import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchLine, type LineRef } from "./rp-match";

const lines: LineRef[] = [
  { id: "a", name: "CAM 08", internalCode: "EBS-BLI-31", factoryId: "f" },
  { id: "b", name: "Blisterflex ONC", internalCode: null, factoryId: "f" },
  { id: "c", name: "CAM 01", internalCode: null, factoryId: "g" },
];

describe("matchLine", () => {
  it("acha pela TAG igual ao código interno", () => {
    assert.equal(matchLine("qualquer", "ebs bli 31", lines)?.id, "a");
  });

  it("acha pela linha igual ao nome, sem espaço nem caixa", () => {
    assert.equal(matchLine("cam01", "EBS-BLI-20", lines)?.id, "c");
    assert.equal(matchLine("blisterflex onc", null, lines)?.id, "b");
  });

  it("não adivinha quando não há resposta única", () => {
    assert.equal(matchLine("cam", "x", lines), null);
    assert.equal(matchLine(null, null, lines), null);
    assert.equal(matchLine("CAM 08", null, [...lines, { id: "d", name: "Cam08", internalCode: null, factoryId: "f" }]), null);
  });
});
