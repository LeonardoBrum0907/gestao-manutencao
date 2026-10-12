import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertVersionCanBeRemoved, assertVersionNameAvailable } from "./equipment-version";

function refused(run: () => void, code: string) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, code);
    assert.equal(error.statusCode, 409);
    return true;
  });
}

describe("nome da versão", () => {
  const siblings = [{ id: "v1", name: "M092" }];

  it("recusa repetido no modelo, ignorando maiúsculas", () => {
    refused(() => assertVersionNameAvailable("m092", siblings, null), "version_name_taken");
  });

  it("aceita o próprio nome ao editar e nome novo", () => {
    assert.doesNotThrow(() => assertVersionNameAvailable("M092", siblings, "v1"));
    assert.doesNotThrow(() => assertVersionNameAvailable("NMX", siblings, null));
  });
});

describe("exclusão da versão", () => {
  it("recusa com máquina ou subconjunto", () => {
    refused(() => assertVersionCanBeRemoved({ machines: 1, subassemblies: 0 }), "version_in_use");
    refused(() => assertVersionCanBeRemoved({ machines: 0, subassemblies: 3 }), "version_in_use");
  });

  it("permite sem uso", () => {
    assert.doesNotThrow(() => assertVersionCanBeRemoved({ machines: 0, subassemblies: 0 }));
  });
});
