import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SessionCache } from "./session.cache";

describe("cache de sessão", () => {
  const later = new Date("2026-10-10T00:00:00.000Z");

  it("lembra o e-mail por alguns segundos", () => {
    const cache = new SessionCache();
    cache.set("h", "gestor@local", later, 1_000);
    assert.equal(cache.get("h", 1_000 + 29_000), "gestor@local");
    assert.equal(cache.get("h", 1_000 + 31_000), null);
  });

  it("esquece quando a sessão em si vence antes do cache", () => {
    const cache = new SessionCache();
    cache.set("h", "gestor@local", new Date(5_000), 1_000);
    assert.equal(cache.get("h", 6_000), null);
  });

  it("esquece na hora no logout", () => {
    const cache = new SessionCache();
    cache.set("h", "gestor@local", later, 1_000);
    cache.delete("h");
    assert.equal(cache.get("h", 1_001), null);
  });
});
