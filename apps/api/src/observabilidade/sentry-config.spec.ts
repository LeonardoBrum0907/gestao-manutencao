import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSentryConfig } from "./sentry-config";

const DSN = "https://abc123@o4500.ingest.us.sentry.io/4501";

describe("readSentryConfig", () => {
  it("fica desligado sem SENTRY_DSN", () => {
    assert.equal(readSentryConfig({}), null);
    assert.equal(readSentryConfig({ SENTRY_DSN: "  " }), null);
  });

  it("lê o DSN e usa producao como ambiente padrão", () => {
    assert.deepEqual(readSentryConfig({ SENTRY_DSN: DSN }), { dsn: DSN, environment: "producao" });
    assert.equal(readSentryConfig({ SENTRY_DSN: DSN, SENTRY_ENVIRONMENT: "teste" })?.environment, "teste");
  });

  it("recusa DSN sem https, sem chave ou sem projeto, sem repetir o DSN", () => {
    assert.throws(() => readSentryConfig({ SENTRY_DSN: "http://abc@o1.ingest.sentry.io/2" }), /recebido: endereço em o1\.ingest\.sentry\.io/);
    assert.throws(() => readSentryConfig({ SENTRY_DSN: "https://o1.ingest.sentry.io/2" }), /<chave>@<host>/);
    assert.throws(() => readSentryConfig({ SENTRY_DSN: "https://abc@o1.ingest.sentry.io/" }), /número do projeto/);
    assert.throws(() => readSentryConfig({ SENTRY_DSN: "abc123" }), /recebido: 6 caracteres que não formam um endereço/);
  });
});
