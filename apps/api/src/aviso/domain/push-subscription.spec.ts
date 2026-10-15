import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { readPushSubscription } from "./push-subscription";

const VALID = { endpoint: "https://fcm.googleapis.com/fcm/send/abc:123", keys: { p256dh: "BNcR-abc_123", auth: "tBHI-tw" } };

function rejects(body: unknown, part: string) {
  assert.throws(() => readPushSubscription(body), (error: unknown) => error instanceof DomainError && error.statusCode === 400 && error.message.includes(part));
}

describe("inscrição de aparelho", () => {
  it("lê endereço, chaves e rótulo", () => {
    assert.deepEqual(readPushSubscription({ ...VALID, label: " Chrome no Android " }), {
      endpoint: VALID.endpoint,
      p256dh: "BNcR-abc_123",
      auth: "tBHI-tw",
      label: "Chrome no Android",
    });
    assert.equal(readPushSubscription(VALID).label, null);
  });

  it("corta rótulo comprido em 120 caracteres", () => {
    assert.equal(readPushSubscription({ ...VALID, label: "x".repeat(300) }).label?.length, 120);
  });

  it("recusa endereço sem https, sem chaves e chave fora de base64url", () => {
    rejects({ ...VALID, endpoint: "http://fcm.googleapis.com/x" }, "esperado https://");
    rejects({ endpoint: VALID.endpoint }, "sem as chaves");
    rejects({ ...VALID, keys: { p256dh: "não é base64", auth: "x" } }, "Chave p256dh");
    rejects({ ...VALID, keys: { p256dh: "abc" } }, "Chave auth");
  });
});
