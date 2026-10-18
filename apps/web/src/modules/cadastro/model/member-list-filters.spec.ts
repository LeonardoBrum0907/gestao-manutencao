import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { memberRoleFilter } from "./member-list-filters";

describe("memberRoleFilter", () => {
  const roles = [{ id: "mecanico" }, { id: "supervisor" }];

  it("devolve a função pedida no endereço", () => {
    assert.equal(memberRoleFilter("mecanico", roles), "mecanico");
    assert.equal(memberRoleFilter("supervisor", roles), "supervisor");
  });

  it("sem pedido ou com função que não existe, não filtra", () => {
    assert.equal(memberRoleFilter(null, roles), "");
    assert.equal(memberRoleFilter("", roles), "");
    assert.equal(memberRoleFilter("technician", roles), "");
  });
});
