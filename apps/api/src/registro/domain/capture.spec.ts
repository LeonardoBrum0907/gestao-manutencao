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
      technicianId: null,
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
          technicianId: null,
        }),
      (error: unknown) => error instanceof DomainError && error.code === "empty_body",
    );
  });
});
