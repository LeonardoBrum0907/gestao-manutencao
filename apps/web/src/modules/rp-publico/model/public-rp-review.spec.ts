import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bulkDoneText, decisionBadgeClass, NOTE_PROMPTS } from "./public-rp-review";

describe("avaliação em lote", () => {
  it("aviso no singular e no plural", () => {
    assert.equal(bulkDoneText("approve", 1), "1 RP aprovado.");
    assert.equal(bulkDoneText("reject", 3), "3 RPs recusados.");
    assert.equal(bulkDoneText("request_review", 2), "2 RPs com revisão pedida.");
  });

  it("só o pedido de revisão exige texto", () => {
    assert.deepEqual([NOTE_PROMPTS.request_review.required, NOTE_PROMPTS.reject.required], [true, false]);
  });

  it("pendente fica sem selo; as outras situações têm cor própria", () => {
    assert.equal(decisionBadgeClass("pending"), null);
    assert.match(decisionBadgeClass("approved") ?? "", /accent-soft/);
    assert.match(decisionBadgeClass("rejected") ?? "", /danger-soft/);
    assert.match(decisionBadgeClass("revision") ?? "", /warn-soft/);
  });
});
