import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inRegistros, scopeWhere } from "./registros-scope";

describe("o que aparece em Registros", () => {
  it("deixa de fora o chamado, o problema espelho de RP antigo e o feedback da ficha", () => {
    assert.deepEqual(inRegistros, { origin: { notIn: ["chamado", "rp", "ficha"] } });
  });

  it("a lista de Registros usa o mesmo filtro", () => {
    assert.deepEqual(scopeWhere("registros"), inRegistros);
  });

  it("o cartão Feedbacks da ficha mostra só o que foi gravado nela", () => {
    assert.deepEqual(scopeWhere("ficha"), { origin: "ficha" });
  });
});
