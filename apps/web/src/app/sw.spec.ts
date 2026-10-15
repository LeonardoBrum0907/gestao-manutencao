import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { runInNewContext } from "node:vm";

// Testa o public/sw.js de verdade: roda o arquivo num contexto isolado com um "self" falso e dispara os eventos.
const SOURCE = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
const ORIGIN = "https://gestao-manutencao.vercel.app";
const OFFLINE_PAGE = new Response("sem conexão");

const online = () => Promise.resolve(new Response("index.html"));
const offline = () => Promise.reject(new TypeError("Failed to fetch"));

// Cada evento do service worker tem o seu formato; os falsos abaixo só têm o que o sw.js usa.
type Listener = (event: never) => void;

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

class FakeRegistration {
  shown: Array<{ title: string; options: Record<string, unknown> }> = [];
  showNotification(title: string, options: Record<string, unknown>): Promise<void> {
    this.shown.push({ title, options });
    return Promise.resolve();
  }
}

class FakeWindowClient {
  navigated: string[] = [];
  constructor(readonly url: string) {}
  focus(): Promise<FakeWindowClient> {
    return Promise.resolve(this);
  }
  navigate(url: string): Promise<FakeWindowClient> {
    this.navigated.push(url);
    return Promise.resolve(this);
  }
}

class FakeClients {
  opened: string[] = [];
  constructor(private readonly windows: FakeWindowClient[]) {}
  matchAll(): Promise<FakeWindowClient[]> {
    return Promise.resolve(this.windows);
  }
  openWindow(url: string): Promise<null> {
    this.opened.push(url);
    return Promise.resolve(null);
  }
}

class FakeExtendableEvent<T> {
  pending: Promise<unknown> = Promise.resolve();
  constructor(readonly fields: T) {}
  waitUntil(work: Promise<unknown>): void {
    this.pending = work;
  }
}

type Worker = { listeners: Map<string, Listener>; registration: FakeRegistration; clients: FakeClients };

function loadWorker(network: () => Promise<Response>, windows: FakeWindowClient[] = []): Worker {
  const listeners = new Map<string, Listener>();
  const registration = new FakeRegistration();
  const clients = new FakeClients(windows);
  const self = { location: { origin: ORIGIN }, registration, clients, addEventListener: (name: string, run: Listener) => listeners.set(name, run) };
  runInNewContext(SOURCE, { self, caches: new FakeCacheStorage(), fetch: network, URL, Response });
  return { listeners, registration, clients };
}

function dispatch(worker: Worker, name: string, event: object): void {
  worker.listeners.get(name)?.(event as never);
}

function navigate(path: string, network: () => Promise<Response>, mode = "navigate"): FakeFetchEvent {
  const event = new FakeFetchEvent({ url: `${ORIGIN}${path}`, mode });
  dispatch(loadWorker(network), "fetch", event);
  return event;
}

async function receivePush(data: { json: () => unknown } | null): Promise<FakeRegistration> {
  const worker = loadWorker(online);
  const event = new FakeExtendableEvent({});
  dispatch(worker, "push", Object.assign(event, { data }));
  await event.pending;
  return worker.registration;
}

async function tapNotification(url: unknown, windows: FakeWindowClient[]): Promise<FakeClients> {
  const worker = loadWorker(online, windows);
  const notification = { data: { url }, close: () => undefined };
  const event = Object.assign(new FakeExtendableEvent({}), { notification });
  dispatch(worker, "notificationclick", event);
  await event.pending;
  return worker.clients;
}


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

describe("sw.js: avisos", () => {
  it("mostra o aviso com título, texto, tag e a tela que abre", async () => {
    const message = { title: "Aviso de teste", body: "Chegou.", url: "/configuracoes/avisos", tag: "teste" };
    const registration = await receivePush({ json: () => message });
    assert.equal(registration.shown[0]?.title, "Aviso de teste");
    assert.equal(registration.shown[0]?.options.body, "Chegou.");
    assert.equal(registration.shown[0]?.options.tag, "teste");
    // O objeto nasce dentro do vm (outro "realm"), então a comparação vai pelo JSON.
    assert.equal(JSON.stringify(registration.shown[0]?.options.data), JSON.stringify({ url: "/configuracoes/avisos" }));
  });

  it("aviso sem conteúdo ou com JSON quebrado ainda aparece, com texto padrão", async () => {
    const empty = await receivePush(null);
    const broken = await receivePush({ json: () => { throw new SyntaxError("x"); } });
    assert.equal(empty.shown[0]?.options.body, "Você tem um aviso novo.");
    assert.equal(broken.shown[0]?.title, "Caderno do Gestor");
  });

  it("tocar reaproveita a janela aberta do app e vai para a tela do aviso", async () => {
    const window = new FakeWindowClient(`${ORIGIN}/dashboard`);
    const clients = await tapNotification("/meu-dia", [window]);
    assert.deepEqual(window.navigated, [`${ORIGIN}/meu-dia`]);
    assert.deepEqual(clients.opened, []);
  });

  it("sem janela aberta, abre uma nova; endereço de fora vira a tela inicial", async () => {
    assert.deepEqual((await tapNotification("/turno/chamados", [])).opened, [`${ORIGIN}/turno/chamados`]);
    assert.deepEqual((await tapNotification("https://golpe.exemplo/x", [])).opened, [`${ORIGIN}/`]);
    assert.deepEqual((await tapNotification("//golpe.exemplo/x", [])).opened, [`${ORIGIN}/`]);
  });
});
