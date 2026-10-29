import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FakeCadastroRefs, FakeProblemLog, FakeRpStore } from "./fake-rp-stores";
import { Rps } from "./rps";

const noCause = { marked: false, text: null };

function body(patch: Record<string, unknown> = {}) {
  return {
    occurredAt: "2026-10-20", factoryId: "f1", lineId: "l1", problem: "Correia rompeu", status: "analysis",
    memberIds: ["m1"], causes: { material: noCause, machine: noCause, method: noCause, labor: noCause }, ...patch,
  };
}

function setup() {
  const store = new FakeRpStore();
  const problems = new FakeProblemLog();
  const rps = new Rps(store, problems, new FakeCadastroRefs());
  return { store, problems, rps };
}

describe("Rps e o Problema espelho", () => {
  it("criar o RP grava o Problema espelho com o texto e os técnicos", async () => {
    const { problems, rps } = setup();
    const rp = await rps.create(body());
    assert.ok(rp.problemRecordId);
    const mirror = problems.saved.get(rp.problemRecordId);
    assert.equal(mirror?.origin, "rp");
    assert.equal(mirror?.body, "Correia rompeu");
    assert.deepEqual(mirror?.memberIds, ["m1"]);
  });

  it("editar o RP leva o status para o espelho", async () => {
    const { problems, rps } = setup();
    const rp = await rps.create(body());
    await rps.update(rp.id, body({ status: "corrected" }));
    assert.equal(problems.saved.get(rp.problemRecordId!)?.status, "done");
  });

  it("excluir o RP apaga o espelho", async () => {
    const { problems, rps } = setup();
    const rp = await rps.create(body());
    await rps.remove(rp.id);
    assert.equal(problems.saved.size, 0);
  });
});
