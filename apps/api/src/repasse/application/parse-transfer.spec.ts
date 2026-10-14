import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseIdList, parseTransferCreate } from "./parse-transfer";

describe("parseTransferCreate", () => {
  it("lê o corpo e aceita equipamentos ausentes", () => {
    assert.deepEqual(parseTransferCreate({ teacherId: " m1 ", learnerId: "m2" }), { teacherId: "m1", learnerId: "m2", equipmentIds: [] });
  });

  it("recusa sem pessoas ou com lista inválida", () => {
    assert.throws(() => parseTransferCreate({ learnerId: "m2" }), /Escolha quem ensina/);
    assert.throws(() => parseTransferCreate({ teacherId: "m1", learnerId: "m2", equipmentIds: "e1" }), /equipmentIds inválido \("e1"\)/);
  });
});

describe("parseIdList", () => {
  it("separa por vírgula e ignora vazios", () => {
    assert.deepEqual(parseIdList("e1, e2,,"), ["e1", "e2"]);
    assert.deepEqual(parseIdList(undefined), []);
  });
});
