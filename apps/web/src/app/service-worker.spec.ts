import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { registerServiceWorker, type ServiceWorkerRegistrar } from "./service-worker";

class FakeServiceWorkerRegistrar implements ServiceWorkerRegistrar {
  calls: Array<{ url: string; scope: string | undefined }> = [];
  constructor(private readonly failure: Error | null = null) {}

  register(url: string | URL, options?: RegistrationOptions): Promise<ServiceWorkerRegistration> {
    this.calls.push({ url: String(url), scope: options?.scope });
    if (this.failure) return Promise.reject(this.failure);
    return Promise.resolve({} as ServiceWorkerRegistration);
  }
}

describe("registerServiceWorker", () => {
  it("registra /sw.js com escopo no site inteiro no build de produção", async () => {
    const registrar = new FakeServiceWorkerRegistrar();
    assert.equal(await registerServiceWorker(registrar, true), true);
    assert.deepEqual(registrar.calls, [{ url: "/sw.js", scope: "/" }]);
  });

  it("não registra no vite dev", async () => {
    const registrar = new FakeServiceWorkerRegistrar();
    assert.equal(await registerServiceWorker(registrar, false), false);
    assert.deepEqual(registrar.calls, []);
  });

  it("não quebra em navegador sem service worker", async () => {
    assert.equal(await registerServiceWorker(undefined, true), false);
  });

  it("falha vira aviso em JSON com a mensagem recebida", async () => {
    const lines: string[] = [];
    const registrar = new FakeServiceWorkerRegistrar(new Error("SecurityError: http sem TLS"));
    assert.equal(await registerServiceWorker(registrar, true, (line) => lines.push(line)), false);
    assert.deepEqual(JSON.parse(lines[0] ?? "{}"), {
      event: "service_worker_register_failed",
      script: "/sw.js",
      message: "SecurityError: http sem TLS",
    });
  });
});
