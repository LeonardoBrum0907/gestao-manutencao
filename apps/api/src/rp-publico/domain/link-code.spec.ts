import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPublicLinkCodeShape, newPublicLinkCode } from "./link-code";

describe("newPublicLinkCode", () => {
  it("vira 24 letras seguras para endereço", () => {
    const code = newPublicLinkCode(() => Buffer.alloc(18, 255));
    assert.equal(code, "________________________");
    assert.equal(isPublicLinkCodeShape(code), true);
  });

  it("sai diferente a cada vez", () => {
    assert.notEqual(newPublicLinkCode(), newPublicLinkCode());
  });
});

describe("isPublicLinkCodeShape", () => {
  it("recusa código curto, longo ou com caractere de fora", () => {
    assert.equal(isPublicLinkCodeShape("abc"), false);
    assert.equal(isPublicLinkCodeShape("a".repeat(25)), false);
    assert.equal(isPublicLinkCodeShape(`${"a".repeat(23)}/`), false);
  });
});
