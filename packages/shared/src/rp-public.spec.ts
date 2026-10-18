import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isRpBulkAction, isRpPublicDecision, rpPublicDecisionOf } from "./rp-public";

describe("rpPublicDecisionOf", () => {
  it("pedido de revisão vem antes de recusa, e recusa antes de aprovação", () => {
    assert.equal(rpPublicDecisionOf({ approved: true, rejected: true, reviewRequested: true }), "revision");
    assert.equal(rpPublicDecisionOf({ approved: true, rejected: true, reviewRequested: false }), "rejected");
    assert.equal(rpPublicDecisionOf({ approved: true, rejected: false, reviewRequested: false }), "approved");
    assert.equal(rpPublicDecisionOf({ approved: false, rejected: false, reviewRequested: false }), "pending");
  });

  it("confere situação e ação vindas de fora", () => {
    assert.deepEqual([isRpPublicDecision("approved"), isRpPublicDecision("ok")], [true, false]);
    assert.deepEqual([isRpBulkAction("reject"), isRpBulkAction("delete")], [true, false]);
  });
});
