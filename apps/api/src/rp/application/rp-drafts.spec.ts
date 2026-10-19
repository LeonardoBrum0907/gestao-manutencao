import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { rpDrafts } from "./rp-drafts";

const rp1 = readFileSync(join(__dirname, "..", "domain", "fixtures", "rp1.txt"), "utf8");
const lines = [{ id: "l8", name: "Cam 08", internalCode: "EBS-BLI-31", factoryId: "f1" }];

describe("rpDrafts", () => {
  it("acha a linha e o técnico do cadastro e guarda o texto colado", () => {
    const [draft] = rpDrafts(rp1, [{ id: "m1", name: "Rogério B", active: true }], lines);
    assert.deepEqual([draft!.lineId, draft!.factoryId, draft!.memberIds, draft!.unmatchedTechnicians], ["l8", "f1", ["m1"], null]);
    assert.equal(draft!.tag, "EBS-BLI-31");
    assert.ok(draft!.rawText.includes("RELATÓRIO PADRÃO"));
  });

  it("técnico ou linha fora das listas viram aviso", () => {
    const [draft] = rpDrafts(rp1, [], []);
    assert.deepEqual([draft!.lineId, draft!.memberIds, draft!.unmatchedTechnicians], [null, [], "Rogério B"]);
    assert.ok(draft!.warnings.some((warning) => warning.includes("Técnico não encontrado no cadastro: Rogério B")));
    assert.ok(draft!.warnings.some((warning) => warning.startsWith("Linha não encontrada")));
  });
});
