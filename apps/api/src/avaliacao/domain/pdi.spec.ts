import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { normalizePdiMachines } from "./pdi";

describe("máquinas do PDI", () => {
  it("tira repetidas", () => {
    assert.deepEqual(normalizePdiMachines({ sponsor: ["a", "a", "b"], development: ["c", "c"] }), {
      sponsor: ["a", "b"],
      development: ["c"],
    });
  });

  it("recusa a mesma máquina como padrinho e em desenvolvimento", () => {
    assert.throws(
      () => normalizePdiMachines({ sponsor: ["a"], development: ["a"] }),
      (error: unknown) => error instanceof DomainError && error.code === "pdi_overlap",
    );
  });
});
