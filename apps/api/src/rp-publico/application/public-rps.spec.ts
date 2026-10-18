import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PublicRpBody } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { PublicWriteLimiter } from "../domain/write-limiter";
import { FakePublicDirectoryStore, FakePublicLinkStore, FakeRpBook, FakeRpRevisionStore, sampleRp } from "./fake-public-rp-stores";
import { PublicLinks } from "./public-links";
import { PublicRps } from "./public-rps";

const CODE = "k8F3qP0zLm2xV7sR9tW1yB4n";
const NOW = new Date("2026-10-18T15:00:00Z");
const noCause = { marked: false, text: null };

function body(patch: Partial<PublicRpBody> = {}): PublicRpBody {
  return {
    occurredAt: "2026-10-18", orderNumber: null, factoryId: "f1", lineId: "l1", line: "Cam 08", tag: "EBS-BLI-31",
    machineId: "mq1", problem: "Esteira travando", description: null, repeatedFailure: false, repeatedTimes: null,
    repeatedPeriod: null, causes: { material: noCause, machine: noCause, method: noCause, labor: noCause },
    rootCause: null, corrective: null, preventive: null, status: "analysis", basicConditionImpact: null, memberIds: ["m1"],
    ...patch,
  };
}

async function setup(limit = 10) {
  const links = new FakePublicLinkStore();
  await links.replace(CODE, NOW);
  const book = new FakeRpBook();
  const people = new FakePublicDirectoryStore();
  const revisions = new FakeRpRevisionStore();
  const limiter = new PublicWriteLimiter({ create: { limit, windowMs: 1000 }, write: { limit, windowMs: 1000 } }, () => 0);
  const service = new PublicRps(new PublicLinks(links, () => NOW), book, people, revisions, limiter, () => NOW);
  return { links, book, people, revisions, service };
}

function rejects(status: number) {
  return (error: unknown) => error instanceof DomainError && error.statusCode === status;
}

describe("PublicRps: link", () => {
  it("recusa código que não existe ou foi trocado", async () => {
    const { links, service } = await setup();
    await assert.rejects(service.page("x".repeat(24), {}), rejects(404));
    await links.replace("n".repeat(24), NOW);
    await assert.rejects(service.page(CODE, {}), rejects(404));
  });
});

describe("PublicRps: lista e leitura", () => {
  it("lista só RPs da página pública, com os nomes dos técnicos", async () => {
    const { book, service } = await setup();
    book.rows = [sampleRp({ id: "pub" }), sampleRp({ id: "colado", source: "paste" })];
    const page = await service.page(CODE, { memberId: "m1", source: "paste", factoryId: "f9" });
    assert.deepEqual(page.items.map((item) => item.id), ["pub"]);
    assert.deepEqual(page.items[0]!.memberNames, ["Rogério B"]);
    assert.deepEqual(book.queries[0], { source: "public", memberId: "m1" });
  });

  it("aceita o filtro de aprovados e diz quais o coordenador conferiu", async () => {
    const { book, service } = await setup();
    book.rows = [sampleRp({ id: "ok", checkedAt: NOW.toISOString() }), sampleRp({ id: "novo" })];
    const page = await service.page(CODE, { checked: "true" });
    assert.deepEqual(book.queries[0], { source: "public", checked: "true" });
    assert.deepEqual(page.items.map((item) => [item.id, item.approved]), [["ok", true], ["novo", false]]);
    assert.equal((await service.get(CODE, "ok")).approved, true);
  });

  it("RP colado no app não abre pelo link", async () => {
    const { book, service } = await setup();
    book.rows = [sampleRp({ id: "colado", source: "paste" })];
    await assert.rejects(service.get(CODE, "colado"), rejects(404));
  });
});

describe("PublicRps: criar", () => {
  it("grava com origem pública, sem chamado nem texto colado", async () => {
    const { book, service } = await setup();
    const created = await service.create(CODE, { ...body(), chamadoId: "c1", rawText: "texto", unmatchedTechnicians: "Zé" });
    const row = await book.get(created.id);
    assert.equal(row.source, "public");
    assert.equal(row.chamadoId, null);
    assert.equal(row.rawText, "");
    assert.equal(row.unmatchedTechnicians, null);
    assert.equal(row.subassemblyId, null);
    assert.deepEqual(created.memberNames, ["Rogério B"]);
  });

  it("exige técnico, e só dos liberados", async () => {
    const { service } = await setup();
    await assert.rejects(service.create(CODE, body({ memberIds: [] })), /pelo menos um técnico/);
    await assert.rejects(service.create(CODE, body({ memberIds: ["m3"] })), /não liberado.*m3/);
  });

  it("campo-isca cheio é recusado", async () => {
    const { service } = await setup();
    await assert.rejects(service.create(CODE, body({ website: "http://spam" })), rejects(400));
  });

  it("texto longo demais é recusado com o tamanho", async () => {
    const { service } = await setup();
    await assert.rejects(service.create(CODE, body({ problem: "x".repeat(2001) })), /Problema.*2001.*2000/);
  });

  it("para depois do limite de envios", async () => {
    const { service } = await setup(1);
    await service.create(CODE, body());
    await assert.rejects(service.create(CODE, body()), rejects(429));
  });
});

describe("PublicRps: editar", () => {
  it("guarda o antes no histórico e mantém o subconjunto se a máquina não mudou", async () => {
    const { book, revisions, service } = await setup();
    book.rows = [sampleRp({ subassemblyId: "sub1", unmatchedTechnicians: "Zé", rawText: "" })];
    await service.update(CODE, "rp1", body({ problem: "Corrigido o texto" }));
    const row = await book.get("rp1");
    assert.equal(row.problem, "Corrigido o texto");
    assert.equal(row.subassemblyId, "sub1");
    assert.equal(row.unmatchedTechnicians, "Zé");
    assert.equal(revisions.rows[0]!.kind, "edit");
    assert.equal(revisions.rows[0]!.before.problem, "Alarme de posição");
  });

  it("trocar a máquina limpa o subconjunto", async () => {
    const { book, service } = await setup();
    book.rows = [sampleRp({ subassemblyId: "sub1" })];
    await service.update(CODE, "rp1", body({ machineId: "mq2" }));
    assert.equal((await book.get("rp1")).subassemblyId, null);
  });

  it("técnico que saiu da lista continua valendo no RP que já tinha", async () => {
    const { book, service } = await setup();
    book.rows = [sampleRp({ memberIds: ["m3"] })];
    await assert.doesNotReject(service.update(CODE, "rp1", body({ memberIds: ["m3", "m1"] })));
  });

  it("editado pelo link volta para não conferido", async () => {
    const { book, service } = await setup();
    book.rows = [sampleRp({ checkedAt: "2026-10-17T10:00:00.000Z" })];
    await service.update(CODE, "rp1", body());
    assert.equal((await book.get("rp1")).checkedAt, null);
  });

  it("editado pelo link sai de recusado e volta para pendente", async () => {
    const { book, service } = await setup();
    book.rows = [sampleRp({ rejectedAt: "2026-10-17T10:00:00.000Z", rejectionNote: "Fora do padrão" })];
    const rp = await service.update(CODE, "rp1", body());
    assert.deepEqual([rp.decision, rp.rejectionNote], ["pending", null]);
  });

  it("marcar revisado apaga o pedido; sem marcar, o pedido fica", async () => {
    const { book, service } = await setup();
    book.rows = [sampleRp({ reviewRequest: "Falta a causa", reviewRequestedAt: "2026-10-17T10:00:00.000Z" })];
    await service.update(CODE, "rp1", body());
    assert.equal((await book.get("rp1")).reviewRequest, "Falta a causa");
    await service.update(CODE, "rp1", body({ revised: true }));
    assert.equal((await book.get("rp1")).reviewRequest, null);
  });
});

describe("PublicRps: pedir revisão", () => {
  it("grava o pedido com a hora e vai para o histórico", async () => {
    const { book, revisions, service } = await setup();
    book.rows = [sampleRp()];
    const rp = await service.requestReview(CODE, "rp1", { text: "  Faltou a causa raiz " });
    assert.equal(rp.reviewRequest, "Faltou a causa raiz");
    assert.equal(rp.reviewRequestedAt, NOW.toISOString());
    assert.equal(revisions.rows[0]!.kind, "review_request");
    assert.equal(revisions.rows[0]!.note, "Faltou a causa raiz");
  });

  it("pedido vazio é recusado", async () => {
    const { book, service } = await setup();
    book.rows = [sampleRp()];
    await assert.rejects(service.requestReview(CODE, "rp1", { text: " " }), /Escreva o que precisa revisar/);
  });
});

describe("PublicRps: aprovar, recusar e pedir revisão em lote", () => {
  it("aprova vários de uma vez, cada um com o antes no histórico", async () => {
    const { book, revisions, service } = await setup();
    book.rows = [sampleRp({ id: "a", rejectedAt: NOW.toISOString(), rejectionNote: "x" }), sampleRp({ id: "b" })];
    assert.deepEqual(await service.bulkReview(CODE, { ids: ["a", "b"], action: "approve" }), { updated: 2 });
    const [a, b] = [await service.get(CODE, "a"), await service.get(CODE, "b")];
    assert.deepEqual([a.decision, b.decision, a.rejectionNote], ["approved", "approved", null]);
    assert.deepEqual(revisions.rows.map((row) => [row.rpId, row.kind]), [["a", "approve"], ["b", "approve"]]);
  });

  it("recusar guarda o motivo e tira a aprovação", async () => {
    const { book, service } = await setup();
    book.rows = [sampleRp({ checkedAt: NOW.toISOString() })];
    await service.bulkReview(CODE, { ids: ["rp1"], action: "reject", note: "Não é falha" });
    const rp = await service.get(CODE, "rp1");
    assert.deepEqual([rp.decision, rp.approved, rp.rejectionNote], ["rejected", false, "Não é falha"]);
  });

  it("pedir revisão em lote vale para todos e aparece no filtro de revisão", async () => {
    const { book, service } = await setup();
    book.rows = [sampleRp({ id: "a" }), sampleRp({ id: "b" })];
    await service.bulkReview(CODE, { ids: ["a", "b"], action: "request_review", note: "Faltou a TAG" });
    const rps = await Promise.all(["a", "b"].map((id) => service.get(CODE, id)));
    assert.deepEqual(rps.map((rp) => [rp.decision, rp.reviewRequest]), [["revision", "Faltou a TAG"], ["revision", "Faltou a TAG"]]);
  });

  it("um RP fora da página pública barra o lote inteiro", async () => {
    const { book, revisions, service } = await setup();
    book.rows = [sampleRp({ id: "a" }), sampleRp({ id: "colado", source: "paste" })];
    await assert.rejects(service.bulkReview(CODE, { ids: ["a", "colado"], action: "approve" }), rejects(404));
    assert.equal(revisions.rows.length, 0);
    assert.equal((await book.get("a")).checkedAt, null);
  });

  it("aceita o filtro de situação na lista", async () => {
    const { book, service } = await setup();
    book.rows = [sampleRp()];
    await service.page(CODE, { decision: "rejected" });
    assert.deepEqual(book.queries[0], { source: "public", decision: "rejected" });
  });
});
