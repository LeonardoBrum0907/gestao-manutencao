import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { involves, sortForProfile, summarizeMemberRecords, type MemberRecordSubject } from "./member-records";

const now = new Date("2026-10-04T15:00:00Z");

function record(overrides: Partial<MemberRecordSubject>): MemberRecordSubject {
  return {
    type: "task",
    status: "open",
    origin: "inbox",
    dueAt: null,
    occurredAt: new Date("2026-10-01T12:00:00Z"),
    memberId: null,
    memberIds: [],
    ...overrides,
  };
}

describe("registros do colaborador", () => {
  it("encontra a pessoa como responsável ou entre os técnicos do chamado", () => {
    assert.equal(involves(record({ memberId: "ana" }), "ana"), true);
    assert.equal(involves(record({ memberIds: ["carlos", "ana"] }), "ana"), true);
    assert.equal(involves(record({ memberId: "carlos" }), "ana"), false);
  });

  it("conta vencida só a tarefa ainda não concluída e deixa o feedback fora de aberto e concluído", () => {
    const yesterday = new Date("2026-10-03T12:00:00Z");
    const summary = summarizeMemberRecords(
      [
        record({ dueAt: yesterday }),
        record({ dueAt: yesterday, status: "done" }),
        record({ dueAt: yesterday, status: "in_progress" }),
        record({ type: "feedback", dueAt: yesterday }),
        record({ type: "problem", origin: "chamado", status: "done" }),
      ],
      now,
    );
    assert.deepEqual(summary, { open: 2, overdue: 2, done: 2, chamados: 1, feedbacks: 1 });
  });

  it("lista o que está aberto antes do concluído, do mais recente para o mais antigo", () => {
    const sorted = sortForProfile([
      { id: "velho-aberto", status: "open" as const, occurredAt: new Date("2026-09-01T00:00:00Z") },
      { id: "novo-concluido", status: "done" as const, occurredAt: new Date("2026-10-03T00:00:00Z") },
      { id: "novo-aberto", status: "in_progress" as const, occurredAt: new Date("2026-10-02T00:00:00Z") },
    ]);
    assert.deepEqual(
      sorted.map((item) => item.id),
      ["novo-aberto", "velho-aberto", "novo-concluido"],
    );
  });
});
