import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertDemoSeedAllowed } from "./demo-guard";

const empty = { factories: 0, members: 0, records: 0, rps: 0 };

describe("trava da carga de demonstração", () => {
  it("roda com a marca do compose da demonstração num banco sem cadastro", () => {
    assert.doesNotThrow(() => assertDemoSeedAllowed("permitido", empty));
  });

  it("recusa sem a marca, como na API da produção", () => {
    assert.throws(() => assertDemoSeedAllowed(undefined, empty), /DEMO_SEED=permitido \(recebido: vazio\)/);
    assert.throws(() => assertDemoSeedAllowed("sim", empty), /recebido: sim/);
  });

  it("recusa um banco que já tem cadastro, dizendo o que achou", () => {
    assert.throws(() => assertDemoSeedAllowed("permitido", { ...empty, factories: 6, rps: 31 }), /factories=6, rps=31/);
  });
});
