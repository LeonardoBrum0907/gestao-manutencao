import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nameOwner } from "./names";

describe("dono do nome", () => {
  const roles = [
    { id: "r1", name: "mecânico" },
    { id: "r2", name: "eletricista" },
  ];

  it("acha o nome igual mesmo com maiúscula diferente", () => {
    assert.equal(nameOwner(roles, "Mecânico")?.id, "r1");
    assert.equal(nameOwner(roles, "ELETRICISTA")?.id, "r2");
  });

  it("nome com acento diferente é outro nome", () => {
    assert.equal(nameOwner(roles, "mecanico"), undefined);
  });

  it("nome livre não tem dono", () => {
    assert.equal(nameOwner(roles, "Caldeireiro"), undefined);
  });
});
