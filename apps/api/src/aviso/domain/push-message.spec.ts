import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pushPayload, testPushMessage } from "./push-message";

describe("aviso de teste", () => {
  it("mostra a hora de Brasília e abre Configurações › Avisos", () => {
    const message = testPushMessage(new Date("2026-10-14T23:50:00Z"));
    assert.equal(message.body, "Os avisos estão chegando neste aparelho. Enviado às 20:50.");
    assert.equal(message.url, "/configuracoes/avisos");
    assert.equal(message.tag, "teste");
  });

  it("vira JSON que o sw.js lê de volta", () => {
    const message = testPushMessage(new Date("2026-10-14T12:00:00Z"));
    assert.deepEqual(JSON.parse(pushPayload(message)), message);
  });
});
