import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { teamFixture } from "./team-fixture";
import { blockQualified, qualifiedCount, sortMembers, teamRowBlocks } from "./team-rows";

const names = (members: { name: string }[]) => members.map((member) => member.name);

describe("técnicos da Matriz da equipe", () => {
  const { members } = teamFixture();

  it("ordena por nome, por quantos domina e pela nota no modelo, com sem nota no fim", () => {
    assert.deepEqual(names(sortMembers(members, { key: "name", dir: 1 }, 80)), ["Ana", "Bia", "Caio", "Davi"]);
    assert.deepEqual(names(sortMembers(members, { key: "count", dir: -1 }, 80)), ["Ana", "Bia", "Caio", "Davi"]);
    assert.deepEqual(names(sortMembers(members, { key: "equipment:caixa", dir: -1 }, 80)), ["Caio", "Bia", "Ana", "Davi"]);
    assert.deepEqual(names(sortMembers(members, { key: "equipment:caixa", dir: 1 }, 80)), ["Bia", "Caio", "Ana", "Davi"]);
  });

  it("agrupa por turno na ordem do cadastro", () => {
    const blocks = teamRowBlocks(sortMembers(members, { key: "name", dir: 1 }, 80), "shift");
    assert.deepEqual(blocks.map((block) => [block.label, names(block.members)]), [["1º turno", ["Ana", "Caio"]], ["2º turno", ["Bia"]], ["3º turno", ["Davi"]]]);
  });

  it("agrupa por grau e por equipe em ordem alfabética, com quem não tem no fim", () => {
    assert.deepEqual(teamRowBlocks(members, "grade").map((block) => block.label), ["Júnior", "Pleno", "Sênior", "Sem grau"]);
    assert.deepEqual(teamRowBlocks(members, "team").map((block) => [block.label, names(block.members)]), [["Elétrica", ["Caio"]], ["Mecânica", ["Bia"]], ["Sem equipe", ["Ana", "Davi"]]]);
    assert.deepEqual(teamRowBlocks(members, "none").map((block) => block.label), [null]);
  });

  it("conta qualificados por técnico e por bloco a partir do corte", () => {
    assert.equal(qualifiedCount(members[1], 80), 2);
    assert.equal(blockQualified(members, "blister", 80), 2);
    assert.equal(blockQualified(members, "blister", 95), 0);
  });
});
