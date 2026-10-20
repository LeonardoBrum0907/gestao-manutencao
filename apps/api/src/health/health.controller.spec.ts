import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HealthController } from "./health.controller";

describe("/health", () => {
  it("responde ok", () => {
    assert.deepEqual(new HealthController().show(), { status: "ok" });
  });
});
