import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProblemWrite } from "../../ports/problem-log";
import { FakeCadastroRefs, FakeProblemLog, FakeRpStore } from "./fake-rp-stores";
import { parseRp } from "./parse-rp";
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

// RP gravado antes de 2026-10-29, ainda com o Problema espelho "rec-antigo".
async function oldRp(store: FakeRpStore, problems: FakeProblemLog) {
  const mirror = { origin: "rp", body: "Correia rompeu", status: "open" } as ProblemWrite;
  problems.saved.set("rec-antigo", mirror);
  const input = parseRp(body());
  const rp = await store.insert({ fields: input.fields, occurredAt: input.occurredAt, rawText: "", problemRecordId: "rec-antigo" });
  return { rp, mirror };
}

describe("Rps sem Problema em Registros", () => {
  it("criar o RP não grava problema", async () => {
    const { problems, rps } = setup();
    const rp = await rps.create(body());
    assert.equal(rp.problemRecordId, null);
    assert.equal(problems.saved.size, 0);
  });

  it("RP da página pública também não grava problema", async () => {
    const { problems, rps } = setup();
    const rp = await rps.createFrom(parseRp(body()), "public");
    assert.equal(rp.source, "public");
    assert.equal(problems.saved.size, 0);
  });

  it("editar não cria problema", async () => {
    const { problems, rps } = setup();
    const rp = await rps.create(body());
    const saved = await rps.update(rp.id, body({ status: "corrected" }));
    assert.equal(saved.problemRecordId, null);
    assert.equal(problems.saved.size, 0);
  });

  it("editar um RP antigo mantém a ligação e não mexe no espelho dele", async () => {
    const { store, problems, rps } = setup();
    const { rp, mirror } = await oldRp(store, problems);
    const saved = await rps.update(rp.id, body({ status: "corrected", problem: "Correia trocada" }));
    assert.equal(saved.problemRecordId, "rec-antigo");
    assert.equal(problems.saved.get("rec-antigo"), mirror);
  });

  it("excluir um RP antigo apaga o espelho dele", async () => {
    const { store, problems, rps } = setup();
    const { rp } = await oldRp(store, problems);
    await rps.remove(rp.id);
    assert.equal(problems.saved.size, 0);
  });

  it("RP escrito a partir de um chamado continua ligado a ele", async () => {
    const { rps } = setup();
    const rp = await rps.create(body({ chamadoId: "ch1" }));
    assert.equal(rp.chamadoId, "ch1");
  });
});
