import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DemoIds } from "./demo-services";

describe("DemoIds", () => {
  it("devolve o id gravado por tipo e chave", () => {
    const ids = new DemoIds();
    ids.set("machine", "m1", "id-1");
    ids.set("line", "m1", "id-2");
    assert.equal(ids.get("machine", "m1"), "id-1");
    assert.equal(ids.optional("line", "m1"), "id-2");
    assert.equal(ids.optional("line", null), null);
  });

  it("explica a chave que faltou", () => {
    assert.throws(() => new DemoIds().get("machine", "m9"), /machine "m9" não foi criado/);
  });
});
