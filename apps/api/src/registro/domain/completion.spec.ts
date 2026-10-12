import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { completionWrite } from "./completion";

describe("data de conclusão do registro", () => {
  it("concluído grava a data, sem trocar a que já tinha", () => {
    assert.equal(completionWrite("done"), "stamp-if-empty");
  });

  it("aberto e em andamento apagam a data", () => {
    assert.equal(completionWrite("open"), "clear");
    assert.equal(completionWrite("in_progress"), "clear");
  });
});
