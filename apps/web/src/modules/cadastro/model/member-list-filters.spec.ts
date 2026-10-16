import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { memberPositionFilter } from "./member-list-filters";

describe("memberPositionFilter", () => {
  it("devolve o cargo pedido no endereço", () => {
    assert.equal(memberPositionFilter("technician"), "technician");
    assert.equal(memberPositionFilter("supervisor"), "supervisor");
  });

  it("sem pedido ou com valor desconhecido, não filtra", () => {
    assert.equal(memberPositionFilter(null), "");
    assert.equal(memberPositionFilter(""), "");
    assert.equal(memberPositionFilter("tecnico"), "");
  });
});
