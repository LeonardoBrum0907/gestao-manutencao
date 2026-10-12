import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { captureRecord } from "./capture";
import { assertRetype, retypeState, type RetypeSubject } from "./retype";

const when = new Date("2026-10-11T12:00:00.000Z");
const fromInbox: RetypeSubject = { type: "task", origin: "inbox", chamadoId: null, attachments: 0 };

function refusedWith(code: string) {
  return (error: unknown) => error instanceof DomainError && error.code === code;
}

describe("trocar o tipo do registro", () => {
  it("aceita registro da Entrada e o mesmo tipo de qualquer origem", () => {
    assert.doesNotThrow(() => assertRetype(fromInbox, "problem"));
    assert.doesNotThrow(() => assertRetype({ ...fromInbox, type: "problem", origin: "rp" }, "problem"));
  });

  it("recusa problema de RP, de chamado ou de ocorrência", () => {
    assert.throws(() => assertRetype({ ...fromInbox, type: "problem", origin: "rp" }, "task"), refusedWith("retype_origin"));
  });

  it("recusa tarefa gerada de chamado", () => {
    assert.throws(() => assertRetype({ ...fromInbox, chamadoId: "c1" }, "feedback"), refusedWith("retype_chamado"));
  });

  it("recusa tarefa com anexo, dizendo quantos", () => {
    assert.throws(
      () => assertRetype({ ...fromInbox, attachments: 2 }, "problem"),
      (error: unknown) => refusedWith("retype_attachments")(error) && (error as Error).message.includes("2"),
    );
  });

  it("feedback não fica em andamento e perde máquina e conjunto", () => {
    const problem = { ...captureRecord({ type: "problem", body: "Vazamento", occurredAt: when, memberId: null, tone: null }), status: "in_progress" as const, machineId: "m1", subassemblyId: "s1" };
    const next = retypeState(problem, "feedback");
    assert.equal(next.type, "feedback");
    assert.equal(next.status, "open");
    assert.equal(next.machineId, null);
    assert.equal(next.subassemblyId, null);
  });

  it("tarefa perde o tom do feedback e guarda texto e observação", () => {
    const feedback = { ...captureRecord({ type: "feedback", body: "Elogiar", occurredAt: when, memberId: "tec", tone: "positive" }), notes: "na reunião" };
    const next = retypeState(feedback, "task");
    assert.equal(next.tone, null);
    assert.equal(next.body, "Elogiar");
    assert.equal(next.notes, "na reunião");
    assert.equal(next.memberId, "tec");
  });

  it("rascunho da Entrada vira tarefa, e tarefa em andamento volta a rascunho aberto", () => {
    assert.doesNotThrow(() => assertRetype({ ...fromInbox, type: "entry" }, "task"));
    const task = { ...captureRecord({ type: "task", body: "Trocar correia", occurredAt: when, memberId: null, tone: null }), status: "in_progress" as const };
    assert.equal(retypeState(task, "entry").status, "open");
  });
});
