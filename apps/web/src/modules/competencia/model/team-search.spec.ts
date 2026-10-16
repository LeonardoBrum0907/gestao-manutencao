import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readTeamCategory, readTeamSearch, writeTeamSearch } from "./team-search";

describe("filtros da Matriz da equipe no endereço", () => {
  it("lê o que veio e ignora foco ou ordem fora do formato", () => {
    const state = readTeamSearch(new URLSearchParams("turno=first&foco=x&linhas=a,b&tecnicos=m1,m2&categoria=electrical&ordem=equipment:e1&sentido=desc"), "training");
    assert.deepEqual(state, {
      shift: "first",
      focus: null,
      lineIds: ["a", "b"],
      memberIds: ["m1", "m2"],
      category: "electrical",
      sort: { key: "equipment:e1", dir: -1 },
    });
  });

  it("sem ordem no endereço vale a da visão", () => {
    assert.deepEqual(readTeamSearch(new URLSearchParams(""), "management").sort, { key: "count", dir: -1 });
  });

  it("escreve e lê de volta o mesmo estado", () => {
    const state = { shift: "", focus: "pdi" as const, lineIds: ["l1"], memberIds: ["m9"], category: "mechanical" as const, sort: { key: "count" as const, dir: -1 as const } };
    assert.deepEqual(readTeamSearch(writeTeamSearch(state), "training"), state);
  });

  it("categoria fora do formato vale a equipe toda", () => {
    assert.equal(readTeamCategory(new URLSearchParams("categoria=mecanico")), null);
    assert.equal(readTeamCategory(new URLSearchParams("")), null);
    assert.equal(readTeamCategory(new URLSearchParams("categoria=mechanical")), "mechanical");
  });
});
