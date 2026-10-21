import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { telemetrySafeUrl } from "./telemetry-url";

describe("telemetrySafeUrl", () => {
  it("esconde o código do link público de RP na tela e na API", () => {
    assert.equal(telemetrySafeUrl("https://app.exemplo/rp/abrir/k8F3x-_9/novo"), "https://app.exemplo/rp/abrir/:code/novo");
    assert.equal(telemetrySafeUrl("/api/public/rp/k8F3x/access"), "/api/public/rp/:code/access");
  });

  it("tira consulta e âncora", () => {
    assert.equal(telemetrySafeUrl("/mcp/authorize?code=segredo&state=1#topo"), "/mcp/authorize");
  });

  it("limpa cada endereço de um texto com vários", () => {
    const text = "falhou /rp/abrir/aaa?x=1 depois /api/public/rp/bbb";
    assert.equal(telemetrySafeUrl(text), "falhou /rp/abrir/:code depois /api/public/rp/:code");
  });

  it("deixa como está o caminho sem nada a esconder", () => {
    assert.equal(telemetrySafeUrl("/api/records/42"), "/api/records/42");
  });
});
