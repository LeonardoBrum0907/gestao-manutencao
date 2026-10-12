import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthorizationCodes } from "./authorization-codes";
import { LoginAttempts } from "./login-attempts";
import { matches, overlay } from "./merge";

describe("códigos do login OAuth", () => {
  const entry = { clientId: "c1", codeChallenge: "ch", redirectUri: "https://claude.ai/cb", scopes: [], resource: null };

  it("vale uma vez, só para o cliente que pediu", () => {
    const codes = new AuthorizationCodes();
    const code = codes.issue(entry, 0);
    assert.equal(codes.peek(code, "outro", 1), null);
    assert.equal(codes.take(code, "c1", 1)?.codeChallenge, "ch");
    assert.equal(codes.take(code, "c1", 2), null);
  });

  it("vence em cinco minutos", () => {
    const codes = new AuthorizationCodes();
    const code = codes.issue(entry, 0);
    assert.equal(codes.peek(code, "c1", 5 * 60 * 1000 + 1), null);
  });
});

describe("trava da senha", () => {
  it("segura por 15 minutos depois de cinco erros e solta com o acerto", () => {
    const attempts = new LoginAttempts();
    for (let i = 0; i < 4; i++) attempts.fail(0);
    assert.equal(attempts.lockedFor(0), 0);
    attempts.fail(0);
    assert.equal(attempts.lockedFor(1_000), 15 * 60 * 1000 - 1_000);
    assert.equal(attempts.lockedFor(15 * 60 * 1000), 0);
    attempts.fail(0);
    attempts.succeed();
    for (let i = 0; i < 4; i++) attempts.fail(0);
    assert.equal(attempts.lockedFor(0), 0);
  });
});

describe("edição parcial", () => {
  it("mantém o que não veio e limpa o que veio como null", () => {
    const next = overlay({ body: "a", notes: "n", status: "open" }, { status: "done", notes: null, body: undefined });
    assert.deepEqual(next, { body: "a", notes: null, status: "done" });
  });

  it("busca sem acento e sem caixa, em qualquer dos campos", () => {
    assert.equal(matches("joao", "João Antônio"), true);
    assert.equal(matches("cam", null, "CAM 08"), true);
    assert.equal(matches("xyz", "João"), false);
    assert.equal(matches(undefined, "qualquer"), true);
  });
});
