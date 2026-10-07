import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchLine, matchMembers, type LineRef, type MemberRef } from "./rp-match";

const members: MemberRef[] = [
  { id: "m1", name: "Rogério Barbosa", active: true },
  { id: "m2", name: "Douglas Silva", active: true },
  { id: "m3", name: "Paulo Paniguel", active: true },
  { id: "m4", name: "Willian John", active: true },
  { id: "m5", name: "Paulo Souza", active: true },
  { id: "m6", name: "Ana Lima", active: false },
  { id: "m7", name: "Ana Reis", active: true },
];

describe("matchMembers", () => {
  it("casa nome com inicial e primeiro nome", () => {
    const result = matchMembers(["Rogério B", "Douglas"], members);
    assert.deepEqual(result.memberIds, ["m1", "m2"]);
    assert.deepEqual(result.unmatched, []);
  });

  it("casa nome completo sem acento nem caixa", () => {
    assert.deepEqual(matchMembers(["paulo paniguel"], members).memberIds, ["m3"]);
  });

  it("deixa de fora quem é ambíguo ou não existe", () => {
    const result = matchMembers(["Paulo", "Carlos", "Willian Jonh"], members);
    assert.deepEqual(result.memberIds, []);
    assert.deepEqual(result.unmatched, ["Paulo", "Carlos", "Willian Jonh"]);
  });

  it("entre homônimos prefere o único ativo", () => {
    assert.deepEqual(matchMembers(["Ana"], members).memberIds, ["m7"]);
  });

  it("não repete o mesmo colaborador", () => {
    assert.deepEqual(matchMembers(["Douglas", "Douglas S"], members).memberIds, ["m2"]);
  });
});

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
