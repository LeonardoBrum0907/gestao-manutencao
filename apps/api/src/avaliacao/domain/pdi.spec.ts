import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { normalizePdiLines } from "./pdi";

describe("linhas do PDI", () => {
  it("tira repetidas", () => {
    assert.deepEqual(normalizePdiLines({ sponsor: ["a", "a", "b"], development: ["c", "c"] }), {
      sponsor: ["a", "b"],
      development: ["c"],
    });
  });

  it("recusa a mesma linha como padrinho e em desenvolvimento", () => {
    assert.throws(
      () => normalizePdiLines({ sponsor: ["a"], development: ["a"] }),
      (error: unknown) => error instanceof DomainError && error.code === "pdi_overlap",
    );
  });
});
