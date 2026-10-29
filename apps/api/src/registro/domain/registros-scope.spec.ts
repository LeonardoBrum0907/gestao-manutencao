import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inRegistros } from "./registros-scope";

describe("o que aparece em Registros", () => {
  it("deixa o chamado de fora", () => {
    assert.deepEqual(inRegistros, { origin: { notIn: ["chamado"] } });
  });
});
