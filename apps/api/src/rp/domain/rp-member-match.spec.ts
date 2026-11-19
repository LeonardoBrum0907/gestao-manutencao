import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchMembers, type MemberRef } from "./rp-member-match";

const members: MemberRef[] = [
  { id: "m1", name: "Rogério Barbosa", active: true },
  { id: "m2", name: "Douglas Silva", active: true },
  { id: "m3", name: "Paulo Paniguel", active: true },
  { id: "m4", name: "Willian John", active: true },
  { id: "m5", name: "Paulo Souza", active: true },
  { id: "m6", name: "Ana Lima", active: false },
  { id: "m7", name: "Ana Reis", active: true },
];

describe("matchMembers", () => {
  it("casa nome com inicial e primeiro nome", () => {
    const result = matchMembers(["Rogério B", "Douglas"], members);
    assert.deepEqual(result.memberIds, ["m1", "m2"]);
    assert.deepEqual(result.unmatched, []);
  });

  it("casa nome completo sem acento nem caixa", () => {
    assert.deepEqual(matchMembers(["paulo paniguel"], members).memberIds, ["m3"]);
  });

  it("deixa de fora quem é ambíguo ou não existe", () => {
    const result = matchMembers(["Paulo", "Carlos", "Willian Jonh"], members);
    assert.deepEqual(result.memberIds, []);
    assert.deepEqual(result.unmatched, ["Paulo", "Carlos", "Willian Jonh"]);
  });

  it("entre homônimos prefere o único ativo", () => {
    assert.deepEqual(matchMembers(["Ana"], members).memberIds, ["m7"]);
  });

  it("não repete o mesmo colaborador", () => {
    assert.deepEqual(matchMembers(["Douglas", "Douglas S"], members).memberIds, ["m2"]);
  });
});

// Nomes reais do cadastro e jeitos que aparecem nos RPs de produção (conferidos em 2026-11-19).
const plant: MemberRef[] = [
  { id: "fabio", name: "FABIO ROGERIO DA SILVA", active: true, teamId: "t1" },
  { id: "elias", name: "ELIAS DOUGLAS MACAMBIRA", active: true, teamId: "t1" },
  { id: "emerson-g", name: "EMERSON CARLOS GERALDO", active: true, teamId: "t1" },
  { id: "emerson-l", name: "Emerson Justino de Lima", active: true, teamId: "t2" },
  { id: "jonas", name: "JONAS VERZOLI MONTEIRO", active: true, teamId: "t1" },
  { id: "jose", name: "JOSE TAVARES DE ALMEIDA NETO", active: true, teamId: "t2", nickname: "Zé Tavares, Zé" },
  { id: "diego-f", name: "DIEGO HENRIQUE MARTINS FRANCISCO", active: true, teamId: "t2" },
  { id: "diego-s", name: "DIEGO STELA RAMOS", active: true, teamId: "t2" },
];

describe("matchMembers com o jeito que o time escreve", () => {
  it("separa iniciais coladas no nome: FabioRS e EliasM", () => {
    assert.deepEqual(matchMembers(["FabioRS", "EliasM"], plant).memberIds, ["fabio", "elias"]);
  });

  it("acha pelo nome do meio quando ninguém tem esse primeiro nome", () => {
    assert.deepEqual(matchMembers(["Douglas"], plant).memberIds, ["elias"]);
  });

  it("acha pelo apelido do cadastro, sem acento nem caixa", () => {
    assert.deepEqual(matchMembers(["ze tavares"], plant).memberIds, ["jose"]);
    assert.deepEqual(matchMembers(["Zé"], plant).memberIds, ["jose"]);
  });

  it("desempata pela equipe dos outros técnicos do mesmo RP", () => {
    assert.deepEqual(matchMembers(["Emerson", "Jonas"], plant), { memberIds: ["emerson-g", "jonas"], unmatched: [] });
  });

  it("sem desempate pela equipe, o nome fica como veio", () => {
    assert.deepEqual(matchMembers(["Diego", "Jonas"], plant), { memberIds: ["jonas"], unmatched: ["Diego"] });
    assert.deepEqual(matchMembers(["Emerson"], plant), { memberIds: [], unmatched: ["Emerson"] });
  });

  it("nome com letra maiúscula no meio não vira inicial", () => {
    assert.deepEqual(matchMembers(["McDonald"], plant).unmatched, ["McDonald"]);
  });
});
