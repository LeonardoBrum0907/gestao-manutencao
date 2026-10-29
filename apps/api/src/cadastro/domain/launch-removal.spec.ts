import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertNoLaunches } from "./launch-removal";

const ALT = "Mude o status da linha para tirá-la de uso.";

describe("exclusão com lançamentos ligados", () => {
  it("deixa excluir quando nada aponta para o item", () => {
    assert.doesNotThrow(() => assertNoLaunches("a linha", { records: 0, rps: 0 }, ALT));
  });

  it("recusa com chamado ou RP ligado e diz quantos", () => {
    assert.throws(
      () => assertNoLaunches("a linha", { records: 2, rps: 1 }, ALT),
      (error: unknown) =>
        error instanceof DomainError &&
        error.statusCode === 409 &&
        error.message === `Não dá para excluir a linha: 2 registros (chamados, tarefas ou problemas) e 1 RP apontam para ela. ${ALT}`,
    );
  });

  it("recusa só com RP", () => {
    assert.throws(() => assertNoLaunches("a fábrica", { records: 0, rps: 3 }, ALT), /3 RPs apontam/);
  });
});
