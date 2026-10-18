import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decisionPatch } from "./rp-decision";

const AT = new Date("2026-10-18T20:00:00Z");

describe("decisionPatch", () => {
  it("aprovar marca conferido e apaga recusa e pedido de revisão", () => {
    assert.deepEqual(decisionPatch("approve", AT, "ignorado"), {
      checkedAt: AT, rejectedAt: null, rejectionNote: null, reviewRequest: null, reviewRequestedAt: null,
    });
  });

  it("recusar guarda o motivo e tira a aprovação", () => {
    const patch = decisionPatch("reject", AT, "Fora do padrão");
    assert.deepEqual([patch.rejectedAt, patch.rejectionNote, patch.checkedAt, patch.reviewRequestedAt], [AT, "Fora do padrão", null, null]);
  });

  it("pedir revisão guarda o texto e tira aprovação e recusa", () => {
    const patch = decisionPatch("request_review", AT, "Faltou a TAG");
    assert.deepEqual([patch.reviewRequest, patch.reviewRequestedAt, patch.checkedAt, patch.rejectedAt], ["Faltou a TAG", AT, null, null]);
  });
});
