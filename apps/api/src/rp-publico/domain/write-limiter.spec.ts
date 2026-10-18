import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { PublicWriteLimiter } from "./write-limiter";

const RULES = { create: { limit: 2, windowMs: 1000 }, write: { limit: 1, windowMs: 1000 } };

describe("PublicWriteLimiter", () => {
  it("recusa com 429 quando passa do limite na janela", () => {
    let now = 0;
    const limiter = new PublicWriteLimiter(RULES, () => now);
    limiter.take("create");
    limiter.take("create");
    assert.throws(() => limiter.take("create"), (error: unknown) => error instanceof DomainError && error.statusCode === 429);
  });

  it("libera de novo quando os envios antigos saem da janela", () => {
    let now = 0;
    const limiter = new PublicWriteLimiter(RULES, () => now);
    limiter.take("write");
    now = 1000;
    assert.doesNotThrow(() => limiter.take("write"));
  });

  it("conta criação e alteração separadas", () => {
    const limiter = new PublicWriteLimiter(RULES, () => 0);
    limiter.take("write");
    assert.doesNotThrow(() => limiter.take("create"));
  });

  it("a mensagem diz o limite", () => {
    const limiter = new PublicWriteLimiter(RULES, () => 0);
    limiter.take("write");
    assert.throws(() => limiter.take("write"), /limite: 1 a cada/);
  });
});
