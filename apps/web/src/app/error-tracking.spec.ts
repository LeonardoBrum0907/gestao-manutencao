import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createErrorTracking, type CaptureError } from "./error-tracking";

class FakeErrorService {
  readonly sent: unknown[] = [];
  readonly capture: CaptureError = (error) => void this.sent.push(error);
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

describe("createErrorTracking", () => {
  it("sem carregador, ignora os erros", () => {
    assert.doesNotThrow(() => createErrorTracking(null).report(new Error("x")));
  });

  it("guarda o erro que chega antes do SDK e manda quando ele carrega", async () => {
    const service = new FakeErrorService();
    const tracking = createErrorTracking(async () => service.capture);
    const early = new Error("cedo");
    tracking.report(early);
    await settle();
    const late = new Error("tarde");
    tracking.report(late);
    assert.deepEqual(service.sent, [early, late]);
  });

  it("avisa no console quando o SDK não carrega, sem quebrar a tela", async () => {
    const warnings: string[] = [];
    const tracking = createErrorTracking(() => Promise.reject(new Error("offline")), (message) => warnings.push(message));
    tracking.report(new Error("x"));
    await settle();
    assert.deepEqual(warnings, ["Serviço de erros não carregou: Error: offline"]);
  });
});
