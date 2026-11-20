import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inRegistros, scopeWhere } from "./registros-scope";

describe("o que aparece em Registros", () => {
  it("deixa de fora o chamado, o problema espelho de RP antigo e a observação da ficha", () => {
    assert.deepEqual(inRegistros, { origin: { notIn: ["chamado", "rp", "ficha"] } });
  });

  it("a lista de Registros usa o mesmo filtro", () => {
    assert.deepEqual(scopeWhere("registros"), inRegistros);
  });

  it("o histórico da ficha mostra a observação da ficha e o feedback de Registros", () => {
    assert.deepEqual(scopeWhere("ficha"), { origin: { notIn: ["chamado", "rp"] } });
  });
});
