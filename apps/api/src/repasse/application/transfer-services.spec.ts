import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { MatrixCatalogDto } from "@manutencao/shared";
import type { TransferMember } from "../domain/transfer-rules";
import { FakeTransferCatalog, FakeTransferStore } from "./fake-transfer-store";
import { TransferBoard } from "./transfer-board";
import { TransferPlanner } from "./transfer-planner";

const catalog: MatrixCatalogDto = {
  equipments: [
    { id: "e1", name: "Blistadeira", archived: false, minQualified: 0 },
    { id: "e2", name: "Encartuchadeira", archived: false, minQualified: 0 },
  ],
  skills: [
    { id: "s1", equipmentId: "e1", subgroup: "A", text: "Trocar formato", level: "basic", archived: false },
    { id: "s2", equipmentId: "e1", subgroup: "A", text: "Ajustar selagem", level: "basic", archived: false },
    { id: "s3", equipmentId: "e2", subgroup: "B", text: "Ajustar magazine", level: "basic", archived: false },
  ],
};

const tech = (id: string, name: string, teamName = "Preventiva"): TransferMember => ({ id, name, teamName, position: "technician", status: "active" });
const score = (memberId: string, skillId: string, value: number) => ({ memberId, skillId, score: value, notApplicable: false });
const NOW = new Date("2026-10-12T15:00:00Z");

let store: FakeTransferStore;
let board: TransferBoard;
let planner: TransferPlanner;

beforeEach(() => {
  store = new FakeTransferStore();
  store.people = [tech("ana", "Ana"), tech("bia", "Bia"), tech("caio", "Caio"), tech("duda", "Duda", "1° turno")];
  store.equipmentsByMember.set("ana", ["e1", "e2"]);
  store.scoreRows = [score("ana", "s1", 4), score("ana", "s2", 3), score("ana", "s3", 3), score("bia", "s1", 3), score("bia", "s2", 2), score("caio", "s1", 4), score("caio", "s2", 4)];
  const fakeCatalog = new FakeTransferCatalog(catalog);
  board = new TransferBoard(store, fakeCatalog);
  planner = new TransferPlanner(store, fakeCatalog);
});

describe("TransferPlanner.suggestions", () => {
  it("mede todos contra o que quem ensina domina, quem já faz mais primeiro", async () => {
    const result = await planner.suggestions("ana", []);
    assert.equal(result.mastered, 3);
    assert.deepEqual(result.teacherEquipments, [{ id: "e1", name: "Blistadeira" }, { id: "e2", name: "Encartuchadeira" }]);
    assert.deepEqual(result.candidates.map((item) => [item.member.name, item.progress.done]), [["Caio", 2], ["Bia", 1], ["Duda", 0]]);
  });

  it("não sugere quem já faz quase tudo", async () => {
    const result = await planner.suggestions("ana", ["e1"]);
    assert.equal(result.candidates.some((item) => item.member.name === "Caio"), false);
  });

  it("mostra com quem cada um já aprende sem tirar da ordem", async () => {
    store.rows.push({ id: "t0", teacherId: "duda", learnerId: "caio", equipmentIds: ["e1"], status: "active", startedAt: NOW, closedAt: null });
    const result = await planner.suggestions("ana", ["e1", "e2"]);
    assert.deepEqual(result.candidates[0], { ...result.candidates[0], learningFrom: ["Duda"], withTeacher: false });
    assert.equal(result.candidates[0]?.member.name, "Caio");
  });

  it("põe no fim quem já aprende com quem ensina", async () => {
    await planner.create({ teacherId: "ana", learnerId: "caio" }, NOW);
    const result = await planner.suggestions("ana", ["e1", "e2"]);
    assert.deepEqual([result.candidates.at(-1)?.member.name, result.candidates.at(-1)?.withTeacher], ["Caio", true]);
  });
});

describe("TransferPlanner.create", () => {
  it("abre o repasse com a matriz inteira de quem ensina por padrão", async () => {
    const created = await planner.create({ teacherId: "ana", learnerId: "bia" }, NOW);
    assert.deepEqual(created.equipmentIds, ["e1", "e2"]);
    assert.deepEqual(created.progress, { mastered: 3, done: 1, near: 1, fromZero: 1, percent: 33 });
  });

  it("quem aprende pode aprender com várias pessoas ao mesmo tempo (N:N)", async () => {
    await planner.create({ teacherId: "ana", learnerId: "bia" }, NOW);
    store.equipmentsByMember.set("caio", ["e1"]);
    const second = await planner.create({ teacherId: "caio", learnerId: "bia" }, NOW);
    assert.equal(second.teacher.name, "Caio");
    assert.equal((await board.list(NOW)).teaching, 2);
  });

  it("recusa abrir o mesmo par duas vezes, mas reabre depois de encerrar", async () => {
    const first = await planner.create({ teacherId: "ana", learnerId: "bia" }, NOW);
    await assert.rejects(planner.create({ teacherId: "ana", learnerId: "bia" }, NOW), /Bia já aprende com Ana num repasse em andamento/);
    await planner.close(first.id, NOW);
    assert.equal((await planner.create({ teacherId: "ana", learnerId: "bia" }, NOW)).learner.name, "Bia");
  });
});

describe("TransferBoard", () => {
  it("lista com o número de técnicos ensinando", async () => {
    await planner.create({ teacherId: "ana", learnerId: "bia" }, NOW);
    const list = await board.list(NOW);
    assert.equal(list.technicians, 4);
    assert.equal(list.teaching, 1);
    assert.equal(list.transfers[0]?.learner.name, "Bia");
  });

  it("detalha o que falta repassar com o PDI aberto", async () => {
    const created = await planner.create({ teacherId: "ana", learnerId: "bia" }, NOW);
    store.pdiItems.push({ id: "p1", memberId: "bia", skillId: "s2" });
    const detail = await board.detail(created.id, NOW);
    assert.deepEqual(detail.gaps.map((gap) => [gap.skillId, gap.learnerScore, gap.openPdiItemId]), [["s2", 2, "p1"], ["s3", null, null]]);
    assert.deepEqual(detail.byEquipment.map((row) => [row.name, row.done, row.mastered]), [["Blistadeira", 1, 2], ["Encartuchadeira", 0, 1]]);
  });

  it("repasse que não existe dá 404", async () => {
    await assert.rejects(board.detail("nada", NOW), /Repasse "nada" não encontrado/);
  });
});
