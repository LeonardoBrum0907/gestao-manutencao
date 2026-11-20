import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { observationRecord } from "./member-observation";

const when = new Date("2026-11-20T12:00:00.000Z");

describe("observação da ficha do colaborador", () => {
  it("vira feedback da pessoa com origem ficha", () => {
    const record = observationRecord("m1", { body: " Ajudou na troca ", occurredAt: when, tone: "positive" });
    assert.equal(record.type, "feedback");
    assert.equal(record.memberId, "m1");
    assert.equal(record.origin, "ficha");
    assert.equal(record.body, "Ajudou na troca");
    assert.equal(record.tone, "positive");
    assert.equal(record.status, "open");
  });

  it("recusa texto vazio como qualquer registro", () => {
    assert.throws(() => observationRecord("m1", { body: "  ", occurredAt: when, tone: null }), /Escreva o texto/);
  });
});
