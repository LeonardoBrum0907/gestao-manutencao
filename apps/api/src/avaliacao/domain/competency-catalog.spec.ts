import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import {
  assertCompetencyCanBeRemoved,
  assertCompetencyNameAvailable,
  assertScorable,
  rowsForYear,
} from "./competency-catalog";

function fails(run: () => unknown, code: string, statusCode: number) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, code);
    assert.equal(error.statusCode, statusCode);
    return true;
  });
}

describe("cadastro de competências", () => {
  it("recusa nome já usado por outra competência", () => {
    fails(() => assertCompetencyNameAvailable("outra", null), "competency_name_taken", 409);
    assert.doesNotThrow(() => assertCompetencyNameAvailable("esta", "esta"));
  });

  it("só exclui competência sem nota", () => {
    fails(() => assertCompetencyCanBeRemoved(3), "competency_in_use", 409);
    assert.doesNotThrow(() => assertCompetencyCanBeRemoved(0));
  });

  it("arquivada não recebe nota nova, mas a nota pode ser limpa", () => {
    fails(() => assertScorable({ archived: true }, 8), "competency_archived", 409);
    assert.doesNotThrow(() => assertScorable({ archived: true }, null));
    assert.doesNotThrow(() => assertScorable({ archived: false }, 8));
  });

  it("mostra as ativas e as arquivadas só no ano em que têm nota", () => {
    const all = [
      { id: "b", name: "B", archived: false, position: 2 },
      { id: "a", name: "A", archived: false, position: 1 },
      { id: "old", name: "Velha", archived: true, position: 3 },
    ];
    assert.deepEqual(rowsForYear(all, []).map((row) => row.id), ["a", "b"]);
    assert.deepEqual(
      rowsForYear(all, [{ competencyId: "old", quarter: 1, score: 6 }]).map((row) => row.id),
      ["a", "b", "old"],
    );
  });
});
