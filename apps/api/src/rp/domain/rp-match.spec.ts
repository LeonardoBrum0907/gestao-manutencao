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

// Linhas e textos de produção (2026-11-19): o técnico escreve sem zero, abrevia ou usa o nome do equipamento.
const plantLines: LineRef[] = ["MED 02", "MED 06", "MED 07", "MED 08", "CAM 07", "UHLMANN 02", "BLISTERFLEX 03", "BLISTERFLEX 06", "ROMACO SACHE"].map(
  (name) => ({ id: name, name, internalCode: null, factoryId: "f" }),
);

describe("matchLine com o jeito que o time escreve", () => {
  it("acha a linha escrita sem zero à esquerda", () => {
    const found = ["med6", "Med 8", "Cam 7", "Blisterflex 6"].map((text) => matchLine(text, null, plantLines)?.id);
    assert.deepEqual(found, ["MED 06", "MED 08", "CAM 07", "BLISTERFLEX 06"]);
  });

  it("acha a linha pelo nome encurtado ou alongado com o mesmo número", () => {
    const found = ["Uhl 2", "Medseal 07", "Mediseal  08", "Mediseal #02", "BLISTER 03", "Romaco Sachês"].map((text) => matchLine(text, null, plantLines)?.id);
    assert.deepEqual(found, ["UHLMANN 02", "MED 07", "MED 08", "MED 02", "BLISTERFLEX 03", "ROMACO SACHE"]);
  });

  it("não adivinha quando o número não existe ou o nome curto serve para duas linhas", () => {
    assert.equal(matchLine("Med 9", null, plantLines), null);
    assert.equal(matchLine("blisterflex ONC", null, plantLines), null);
    const twoMeds = [...plantLines, { id: "MEDISEAL 06", name: "MEDISEAL 06", internalCode: null, factoryId: "f" }];
    assert.equal(matchLine("Med 6", null, twoMeds)?.id, "MED 06");
    assert.equal(matchLine("Medi 06", null, twoMeds), null);
  });
});
