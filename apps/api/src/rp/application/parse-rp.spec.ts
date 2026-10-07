import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { parseRp, parseRpText } from "./parse-rp";
import { parseRpList } from "./parse-rp-list";

const valid = {
  occurredAt: "2026-10-04",
  factoryId: "f1",
  problem: "  Esteira parada ",
  status: "corrected",
  memberIds: ["a", " a ", "b"],
  causes: { labor: { marked: true, text: "sim" } },
};

describe("parseRp", () => {
  it("lê o dia do relatório ao meio-dia UTC e limpa os campos", () => {
    const input = parseRp(valid);
    assert.equal(input.occurredAt.toISOString(), "2026-10-04T12:00:00.000Z");
    assert.equal(input.fields.problem, "Esteira parada");
    assert.deepEqual(input.fields.memberIds, ["a", "b"]);
    assert.equal(input.fields.causes.labor.marked, true);
    assert.equal(input.fields.causes.material.marked, false);
    assert.equal(input.fields.orderNumber, null);
  });

  it("exige data, fábrica, problema e status válido", () => {
    for (const patch of [{ occurredAt: "" }, { occurredAt: "31/02" }, { factoryId: " " }, { problem: "" }, { status: "x" }]) {
      assert.throws(() => parseRp({ ...valid, ...patch }), (error) => error instanceof DomainError && error.statusCode === 400);
    }
  });

  it("recusa técnicos que não sejam texto", () => {
    assert.throws(() => parseRp({ ...valid, memberIds: [1] }), DomainError);
  });
});

describe("parseRpText", () => {
  it("exige o texto colado", () => {
    assert.equal(parseRpText({ text: " oi " }), "oi");
    assert.throws(() => parseRpText({ text: "  " }), DomainError);
    assert.throws(() => parseRpText(null), DomainError);
  });
});

describe("parseRpList", () => {
  it("aplica o limite padrão e lê os filtros", () => {
    const filter = parseRpList({ status: "analysis,corrected", repeated: "true", from: "2026-10-01", q: " motor " });
    assert.equal(filter.limit, 50);
    assert.deepEqual(filter.statuses, ["analysis", "corrected"]);
    assert.equal(filter.repeated, true);
    assert.equal(filter.from, "2026-10-01");
    assert.equal(filter.q, "motor");
    assert.equal(filter.lineId, null);
  });

  it("recusa filtro inválido", () => {
    for (const query of [{ status: "x" }, { repeated: "talvez" }, { from: "ontem" }, { limit: "0" }, { limit: "1000" }]) {
      assert.throws(() => parseRpList(query), DomainError);
    }
  });
});
