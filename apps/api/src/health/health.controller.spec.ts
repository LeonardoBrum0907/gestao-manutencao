import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ServiceUnavailableException } from "@nestjs/common";
import type { DatabaseProbe } from "./application/database-probe";
import { HealthController } from "./health.controller";

class FakeDatabaseProbe implements DatabaseProbe {
  constructor(private readonly reachable: boolean) {}

  async isReachable(): Promise<boolean> {
    return this.reachable;
  }
}

describe("/health", () => {
  it("responde ok com o banco respondendo", async () => {
    assert.deepEqual(await new HealthController(new FakeDatabaseProbe(true)).show(), { status: "ok" });
  });

  it("responde 503 com o banco fora do ar", async () => {
    await assert.rejects(new HealthController(new FakeDatabaseProbe(false)).show(), (error: unknown) => {
      return error instanceof ServiceUnavailableException && error.getStatus() === 503;
    });
  });
});
