import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { captureRecord } from "./capture";

describe("captura", () => {
  it("grava o mínimo com origem inbox e status aberto", () => {
    const when = new Date("2026-09-30T12:00:00.000Z");
    const record = captureRecord({
      type: "task",
      body: "  Trocar sensor  ",
      occurredAt: when,
      memberId: null,
      tone: null,
    });
    assert.equal(record.body, "Trocar sensor");
    assert.equal(record.status, "open");
    assert.equal(record.origin, "inbox");
    assert.equal(record.dueAt, null);
    assert.equal(record.priority, null);
  });

  it("recusa texto vazio", () => {
    assert.throws(
      () =>
        captureRecord({
          type: "feedback",
          body: "   ",
          occurredAt: new Date(),
          memberId: null,
          tone: null,
        }),
      (error: unknown) => error instanceof DomainError && error.code === "empty_body",
    );
  });
});

describe("tom do feedback", () => {
  it("guarda o tom no feedback", () => {
    const record = captureRecord({ type: "feedback", body: "Ajudou o colega", occurredAt: new Date(), memberId: "ana", tone: "positive" });
    assert.equal(record.tone, "positive");
  });

  it("recusa tom fora do feedback", () => {
    assert.throws(
      () => captureRecord({ type: "task", body: "Trocar sensor", occurredAt: new Date(), memberId: null, tone: "negative" }),
      (error: unknown) => error instanceof DomainError && error.code === "tone",
    );
  });
});
