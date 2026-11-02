import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inRegistros } from "./registros-scope";

describe("o que aparece em Registros", () => {
  it("deixa de fora o chamado e o problema espelho de RP antigo", () => {
    assert.deepEqual(inRegistros, { origin: { notIn: ["chamado", "rp"] } });
  });
});
