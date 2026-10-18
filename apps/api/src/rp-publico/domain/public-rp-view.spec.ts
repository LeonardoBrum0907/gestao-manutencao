import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sampleRp } from "../application/fake-public-rp-stores";
import { publicFieldsOf, toPublicRp } from "./public-rp-view";

describe("publicFieldsOf", () => {
  it("deixa de fora o que é do coordenador", () => {
    const fields = publicFieldsOf(sampleRp({ subassemblyId: "sub1", unmatchedTechnicians: "Fulano" })) as Record<string, unknown>;
    for (const key of ["subassemblyId", "unmatchedTechnicians", "rawText", "chamadoId", "problemRecordId", "checkedAt", "source"]) {
      assert.equal(key in fields, false, key);
    }
  });
});

describe("toPublicRp", () => {
  it("põe os nomes dos técnicos que conhece, na ordem do RP", () => {
    const rp = toPublicRp(sampleRp({ memberIds: ["m1", "m2"] }), new Map([["m2", "Bruno"], ["m1", "Rogério B"]]));
    assert.deepEqual(rp.memberNames, ["Rogério B", "Bruno"]);
  });

  it("pula técnico sem nome em vez de mostrar o id", () => {
    assert.deepEqual(toPublicRp(sampleRp({ memberIds: ["m1", "m2"] }), new Map([["m1", "Rogério B"]])).memberNames, ["Rogério B"]);
  });
});

describe("toPublicRp: situação", () => {
  const at = "2026-10-18T10:00:00.000Z";

  it("pedido de revisão vence conferido antigo: não conta como aprovado", () => {
    const rp = toPublicRp(sampleRp({ checkedAt: at, reviewRequestedAt: at, reviewRequest: "x" }), new Map());
    assert.deepEqual([rp.decision, rp.approved], ["revision", false]);
  });

  it("sem marca nenhuma fica pendente; recusado leva o motivo", () => {
    assert.equal(toPublicRp(sampleRp(), new Map()).decision, "pending");
    const rejected = toPublicRp(sampleRp({ rejectedAt: at, rejectionNote: "Duplicado" }), new Map());
    assert.deepEqual([rejected.decision, rejected.rejectionNote], ["rejected", "Duplicado"]);
  });
});
