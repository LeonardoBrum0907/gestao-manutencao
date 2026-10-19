import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compareRoleNames, rolesToSeed } from "./role-seed";

describe("funções do SIGEM ao subir a API", () => {
  it("cria as seis num banco sem função, Mecânico e Eletricista já na categoria delas, e Supervisor liderando equipe", () => {
    const seed = rolesToSeed([]);
    assert.deepEqual(
      seed.map((role) => role.name),
      ["mecânico", "eletricista", "automação", "instrumentação", "manutenção", "utilidades", "Supervisor"],
    );
    assert.deepEqual(
      seed.filter((role) => role.leadsTeams).map((role) => role.name),
      ["Supervisor"],
    );
    assert.equal(seed[0].matrixCategory, "mechanical");
    assert.equal(seed[1].matrixCategory, "electrical");
    assert.equal(seed[2].matrixCategory, null);
  });

  // Regressão: renomear "mecânico" para "Mecânico" fazia a API recriar "mecânico" no boot seguinte.
  it("não recria nada quando já existe alguma função", () => {
    assert.deepEqual(rolesToSeed([{ leadsTeams: false }]), []);
    assert.deepEqual(rolesToSeed(Array.from({ length: 7 }, () => ({ leadsTeams: false }))), []);
  });
});

describe("ordem das funções", () => {
  it("põe as do SIGEM na ordem delas, renomeadas ou não, e as outras por nome no fim", () => {
    const names = ["Caldeireiro", "utilidades", "Eletricista", "Automação", "Mecânico", "Almoxarife"];
    assert.deepEqual([...names].sort(compareRoleNames), ["Mecânico", "Eletricista", "Automação", "utilidades", "Almoxarife", "Caldeireiro"]);
  });
});
