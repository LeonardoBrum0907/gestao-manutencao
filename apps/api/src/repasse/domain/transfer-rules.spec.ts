import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TransferCandidateDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { assertNewTransfer, focusEquipments, rankCandidates, requireTechnician, type TransferMember } from "./transfer-rules";

const member = (id: string, name: string, extra: Partial<TransferMember> = {}): TransferMember => ({ id, name, teamName: null, position: "technician", status: "active", ...extra });

describe("requireTechnician", () => {
  it("aceita técnico ativo ou de férias", () => {
    assert.equal(requireTechnician(member("m1", "Ana", { status: "vacation" }), "m1").name, "Ana");
  });

  it("recusa supervisor, desligado e quem não existe", () => {
    assert.throws(() => requireTechnician(member("m1", "Ana", { position: "supervisor" }), "m1"), /Ana não é técnico ativo/);
    assert.throws(() => requireTechnician(member("m1", "Ana", { status: "inactive" }), "m1"), /Ana não é técnico ativo/);
    assert.throws(() => requireTechnician(null, "m9"), (error: unknown) => error instanceof DomainError && error.statusCode === 404);
  });
});

describe("focusEquipments", () => {
  it("sem pedido, a matriz inteira de quem ensina", () => {
    assert.deepEqual(focusEquipments([], ["e1", "e2"], "Ana"), ["e1", "e2"]);
  });

  it("tira repetidos e recusa equipamento fora da matriz", () => {
    assert.deepEqual(focusEquipments(["e1", "e1"], ["e1", "e2"], "Ana"), ["e1"]);
    assert.throws(() => focusEquipments(["e3"], ["e1"], "Ana"), /fora da matriz de Ana: e3/);
  });
});

describe("assertNewTransfer", () => {
  const ana = member("m1", "Ana");
  const bia = member("m2", "Bia");

  it("passa num par livre com o que ensinar", () => {
    assert.doesNotThrow(() => assertNewTransfer({ teacher: ana, learner: bia, learnerTeacherName: null, mastered: 5 }));
  });

  it("recusa a mesma pessoa, quem já aprende com alguém e quem não domina nada", () => {
    assert.throws(() => assertNewTransfer({ teacher: ana, learner: ana, learnerTeacherName: null, mastered: 5 }), /pessoas diferentes/);
    assert.throws(() => assertNewTransfer({ teacher: ana, learner: bia, learnerTeacherName: "Caio", mastered: 5 }), /Bia já aprende com Caio/);
    assert.throws(() => assertNewTransfer({ teacher: ana, learner: bia, learnerTeacherName: null, mastered: 0 }), /Ana não tem nota 3 ou 4/);
  });
});

describe("rankCandidates", () => {
  const candidate = (name: string, done: number, learningFrom: string | null = null): TransferCandidateDto => ({
    member: { id: name, name, teamName: null },
    progress: { mastered: 10, done, near: 0, fromZero: 10 - done, percent: done * 10 },
    learningFrom,
  });

  it("tira quem já faz 90% ou mais", () => {
    assert.deepEqual(rankCandidates([candidate("Arlan", 9), candidate("Bia", 8)]).map((item) => item.member.name), ["Bia"]);
  });

  it("livres primeiro, depois quem já faz mais, depois o nome", () => {
    const ranked = rankCandidates([candidate("Caio", 8, "Ana"), candidate("Bia", 3), candidate("Duda", 7), candidate("Alan", 3)]);
    assert.deepEqual(ranked.map((item) => item.member.name), ["Duda", "Alan", "Bia", "Caio"]);
  });
});
