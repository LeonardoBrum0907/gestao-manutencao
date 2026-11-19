import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rpPlaceKey, rpPlacePrefixMatch, sameRpPlace } from "./rp-place-key";

describe("rpPlaceKey: letras e números da linha ou da TAG", () => {
  it("tira acento, pontuação e zero à esquerda", () => {
    assert.deepEqual(rpPlaceKey("Cam#05."), { letters: "cam", numbers: "5" });
    assert.deepEqual(rpPlaceKey("Romaco Sachês"), { letters: "romacosaches", numbers: "" });
    assert.deepEqual(rpPlaceKey("EBS-ECT-04"), { letters: "ebsect", numbers: "4" });
  });

  it("ignora a palavra linha e o comentário entre parênteses", () => {
    assert.deepEqual(rpPlaceKey("Linha Med 06"), { letters: "med", numbers: "6" });
    assert.deepEqual(rpPlaceKey("MED 06 (encartuchadeira)"), { letters: "med", numbers: "6" });
  });
});

describe("sameRpPlace: mesma linha ou mesma TAG", () => {
  // Jeitos de escrever que apareceram nos RPs de produção (conferidos em 2026-11-19).
  it("casa número sem zero e escrita sem espaço", () => {
    const pairs: [string, string][] = [["med6", "MED 06"], ["Cam 7", "CAM 07"], ["CAM 6", "CAM 06"], ["Med07", "MED 07"], ["Blisterflex 6", "BLISTERFLEX 06"]];
    assert.deepEqual(pairs.map(([given, saved]) => sameRpPlace(given, saved)), [true, true, true, true, true]);
  });

  it("casa TAG com ponto no fim, espaço no lugar do traço e sem zero", () => {
    const tags = ["EBS-DOB-34.", "EBS DOB 34", "ebs-dob- 34", "EBSDOB34"];
    assert.deepEqual(tags.map((tag) => sameRpPlace(tag, "EBS-DOB-34")), [true, true, true, true]);
    assert.equal(sameRpPlace("EBS-BLI-6", "EBS-BLI-06"), true);
  });

  it("não casa número, letras diferentes ou texto vazio", () => {
    assert.equal(sameRpPlace("MED 6", "MED 08"), false);
    assert.equal(sameRpPlace("CAM 6", "MED 06"), false);
    assert.equal(sameRpPlace("EBS-BLI-21", "EBS-ECT-21"), false);
    assert.equal(sameRpPlace("---", "---"), false);
  });
});

describe("rpPlacePrefixMatch: nome encurtado ou alongado", () => {
  it("casa abreviação e nome com sobra, com o mesmo número", () => {
    const pairs: [string, string][] = [
      ["Uhl 2", "UHLMANN 02"],
      ["Medseal 07", "MED 07"],
      ["Mediseal #02", "MED 02"],
      ["BLISTER 03", "BLISTERFLEX 03"],
      ["Romaco Sachês", "ROMACO SACHE"],
      ["Romaco", "ROMACO SACHE"],
    ];
    assert.deepEqual(pairs.map(([given, saved]) => rpPlacePrefixMatch(given, saved)), [true, true, true, true, true, true]);
  });

  it("não casa com número diferente nem com menos de 3 letras", () => {
    assert.equal(rpPlacePrefixMatch("Uhl 3", "UHLMANN 02"), false);
    assert.equal(rpPlacePrefixMatch("blisterflex ONC", "BLISTERFLEX 01"), false);
    assert.equal(rpPlacePrefixMatch("M6", "MED 06"), false);
  });
});
