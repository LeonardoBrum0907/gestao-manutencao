import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { parseRecordList } from "./parse-record-list";

describe("filtros da lista de registros", () => {
  it("sem filtro traz tudo, 50 por página", () => {
    assert.deepEqual(parseRecordList({}), {
      types: null,
      statuses: null,
      due: null,
      lineIds: null,
      memberId: null,
      cursor: null,
      limit: 50,
    });
  });

  it("aceita listas separadas por vírgula", () => {
    const filter = parseRecordList({ type: "task,problem", status: "open,in_progress", lineIds: "m1,m2", memberId: "p1", cursor: "c1", limit: "20" });
    assert.deepEqual(filter.types, ["task", "problem"]);
    assert.deepEqual(filter.statuses, ["open", "in_progress"]);
    assert.deepEqual(filter.lineIds, ["m1", "m2"]);
    assert.equal(filter.memberId, "p1");
    assert.equal(filter.cursor, "c1");
    assert.equal(filter.limit, 20);
  });

  it("recusa tipo, status, prazo e limite inválidos", () => {
    for (const query of [{ type: "task,foo" }, { status: "x" }, { due: "later" }, { limit: "0" }, { limit: "101" }, { limit: "abc" }]) {
      assert.throws(() => parseRecordList(query), (error) => error instanceof DomainError && error.statusCode === 400, JSON.stringify(query));
    }
  });
});
