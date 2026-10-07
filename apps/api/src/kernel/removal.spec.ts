import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "./domain-error";
import { removalCheck } from "./removal";

describe("checagem antes de excluir", () => {
  it("libera quando as regras passam", async () => {
    assert.deepEqual(await removalCheck(async () => undefined), { canRemove: true, reason: null });
  });

  it("devolve o motivo do bloqueio no lugar do 409", async () => {
    const result = await removalCheck(async () => {
      throw new DomainError("in_use", 409, "Está em uso.");
    });
    assert.deepEqual(result, { canRemove: false, reason: "Está em uso." });
  });

  it("deixa passar os outros erros, como o 404", async () => {
    await assert.rejects(
      removalCheck(async () => {
        throw new DomainError("not_found", 404, "Não encontrado.");
      }),
      (error: unknown) => error instanceof DomainError && error.statusCode === 404,
    );
  });
});
