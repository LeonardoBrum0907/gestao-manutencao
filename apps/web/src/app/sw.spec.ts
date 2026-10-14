import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { runInNewContext } from "node:vm";

// Testa o public/sw.js de verdade: roda o arquivo num contexto isolado com um "self" falso e dispara os eventos.
const SOURCE = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
const ORIGIN = "https://gestao-manutencao.vercel.app";
const OFFLINE_PAGE = new Response("sem conexão");

type Listener = (event: FakeFetchEvent) => void;

class FakeFetchEvent {
  responded: Promise<Response> | null = null;
  constructor(readonly request: { url: string; mode: string }) {}
  respondWith(response: Promise<Response>): void {
    this.responded = response;
  }
}

class FakeCacheStorage {
  match(url: string): Promise<Response | undefined> {
    return Promise.resolve(url === "/offline.html" ? OFFLINE_PAGE : undefined);
  }
}

function loadWorker(network: () => Promise<Response>): Map<string, Listener> {
  const listeners = new Map<string, Listener>();
  const self = { location: { origin: ORIGIN }, addEventListener: (name: string, run: Listener) => listeners.set(name, run) };
  runInNewContext(SOURCE, { self, caches: new FakeCacheStorage(), fetch: network, URL, Response });
  return listeners;
}

function navigate(path: string, network: () => Promise<Response>, mode = "navigate"): FakeFetchEvent {
  const event = new FakeFetchEvent({ url: `${ORIGIN}${path}`, mode });
  loadWorker(network).get("fetch")?.(event);
  return event;
}

const online = () => Promise.resolve(new Response("index.html"));
const offline = () => Promise.reject(new TypeError("Failed to fetch"));

describe("sw.js", () => {
  it("abre as telas pela rede, sem cache", async () => {
    const event = navigate("/meu-dia", online);
    assert.equal(await (await event.responded)?.text(), "index.html");
  });

  it("sem internet, mostra a página offline", async () => {
    const event = navigate("/turno/chamados", offline);
    assert.equal(await event.responded, OFFLINE_PAGE);
  });

  it("não mexe nos pedidos de dados nem em arquivos", () => {
    assert.equal(navigate("/assets/index.js", offline, "no-cors").responded, null);
    assert.equal(navigate("/api/records", offline, "cors").responded, null);
  });

  it("deixa a API e o login do conector do Claude passarem direto", () => {
    for (const path of ["/api/session", "/health", "/mcp", "/authorize?client_id=x", "/token", "/register", "/revoke", "/.well-known/oauth-authorization-server"]) {
      assert.equal(navigate(path, offline).responded, null, path);
    }
  });

  it("não confunde telas do app que começam com o nome de uma rota da API", async () => {
    const event = navigate("/healthcheck-falso", offline);
    assert.equal(await event.responded, OFFLINE_PAGE);
  });
});
