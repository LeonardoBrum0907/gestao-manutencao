import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { publicFieldsOf } from "../domain/public-rp-view";
import { FakePublicDirectoryStore, FakeRpBook, FakeRpRevisionStore, sampleRp } from "./fake-public-rp-stores";
import { RpReviews } from "./rp-reviews";

const NOW = new Date("2026-10-18T15:00:00Z");

function setup() {
  const book = new FakeRpBook();
  const revisions = new FakeRpRevisionStore();
  const people = new FakePublicDirectoryStore();
  return { book, revisions, people, reviews: new RpReviews(book, revisions, people, () => NOW) };
}

describe("RpReviews", () => {
  it("conferir grava a hora; desmarcar volta para nulo", async () => {
    const { book, reviews } = setup();
    book.rows = [sampleRp()];
    assert.equal((await reviews.setChecked("rp1", { checked: true })).checkedAt, NOW.toISOString());
    assert.equal((await reviews.setChecked("rp1", { checked: false })).checkedAt, null);
  });

  it("conferir no app aprova: tira a recusa e o pedido de revisão do supervisor", async () => {
    const { book, reviews } = setup();
    book.rows = [sampleRp({ rejectedAt: NOW.toISOString(), rejectionNote: "x", reviewRequest: "y", reviewRequestedAt: NOW.toISOString() })];
    const rp = await reviews.setChecked("rp1", { checked: true });
    assert.deepEqual([rp.checkedAt, rp.rejectedAt, rp.rejectionNote, rp.reviewRequest], [NOW.toISOString(), null, null, null]);
  });

  it("desfazer volta os campos da versão e guarda o estado de agora", async () => {
    const { book, revisions, reviews } = setup();
    const before = publicFieldsOf(sampleRp({ problem: "Texto original" }));
    book.rows = [sampleRp({ problem: "Estragado pelo link", subassemblyId: "sub1" })];
    const revision = await revisions.add({ rpId: "rp1", kind: "edit", before, note: null });
    const saved = await reviews.restore("rp1", revision.id);
    assert.equal(saved.problem, "Texto original");
    assert.equal(saved.subassemblyId, "sub1");
    assert.equal(revisions.rows[1]!.kind, "restore");
    assert.equal(revisions.rows[1]!.before.problem, "Estragado pelo link");
  });

  it("versão de outro RP não serve", async () => {
    const { book, revisions, reviews } = setup();
    book.rows = [sampleRp(), sampleRp({ id: "rp2" })];
    const revision = await revisions.add({ rpId: "rp2", kind: "edit", before: publicFieldsOf(sampleRp()), note: null });
    await assert.rejects(reviews.restore("rp1", revision.id), (error: unknown) => error instanceof DomainError && error.statusCode === 404);
  });

  it("liga e desliga o técnico no formulário público", async () => {
    const { people, reviews } = setup();
    assert.deepEqual(await reviews.setMemberPublicRp("m3", { enabled: true }), { id: "m3", publicRp: true });
    assert.ok((await people.allowedMemberIds()).includes("m3"));
    await assert.rejects(reviews.setMemberPublicRp("nao-existe", { enabled: true }), /não encontrado/);
  });
});
