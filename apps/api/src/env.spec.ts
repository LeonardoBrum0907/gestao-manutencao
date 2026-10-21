import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadEnv, readVapidKeys } from "./env";

// Chaves com o formato certo (base64url, 87 e 43 caracteres); não servem para enviar nada.
const PUBLIC_KEY = `B${"A".repeat(86)}`;
const PRIVATE_KEY = "x".repeat(43);
const BASE = { DATABASE_URL: "postgresql://u:p@db:5432/m", SESSION_SECRET: "segredo" };

describe("loadEnv", () => {
  it("mantém os padrões de antes e fica sem chaves de aviso quando o .env não tem", () => {
    const env = loadEnv(BASE);
    assert.equal(env.port, 3000);
    assert.equal(env.publicUrl, "http://localhost:3000");
    assert.equal(env.attachmentDir, "/data/attachments");
    assert.equal(env.cookieSecure, false);
    assert.equal(env.vapid, null);
    assert.equal(env.sentry, null);
  });

  it("lê as chaves de aviso junto com o resto", () => {
    const env = loadEnv({ ...BASE, PUBLIC_URL: "https://app.exemplo/", VAPID_PUBLIC_KEY: PUBLIC_KEY, VAPID_PRIVATE_KEY: PRIVATE_KEY });
    assert.deepEqual(env.vapid, { publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY, subject: "https://app.exemplo" });
  });
});

describe("readVapidKeys", () => {
  it("usa o endereço público https como contato e mailto quando ele é http", () => {
    const keys = { VAPID_PUBLIC_KEY: PUBLIC_KEY, VAPID_PRIVATE_KEY: PRIVATE_KEY };
    assert.equal(readVapidKeys(keys, "https://app.exemplo")?.subject, "https://app.exemplo");
    assert.equal(readVapidKeys(keys, "http://localhost:3000")?.subject, "mailto:gestor@localhost");
    assert.equal(readVapidKeys({ ...keys, VAPID_SUBJECT: "mailto:leo@exemplo.com" }, "https://x")?.subject, "mailto:leo@exemplo.com");
  });

  it("recusa só uma das chaves, tamanho errado e contato sem https ou mailto", () => {
    assert.throws(() => readVapidKeys({ VAPID_PUBLIC_KEY: PUBLIC_KEY }, "https://x"), /vêm juntas/);
    assert.throws(() => readVapidKeys({ VAPID_PUBLIC_KEY: "curta", VAPID_PRIVATE_KEY: PRIVATE_KEY }, "https://x"), /87 caracteres base64url \(recebido: 5/);
    assert.throws(() => readVapidKeys({ VAPID_PUBLIC_KEY: PUBLIC_KEY, VAPID_PRIVATE_KEY: PRIVATE_KEY, VAPID_SUBJECT: "leo@x" }, "https://x"), /recebido: leo@x/);
  });
});
