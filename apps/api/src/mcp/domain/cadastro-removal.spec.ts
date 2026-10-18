import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertNothingLinked, describeCadastroLinks, NO_CADASTRO_LINKS, SCREEN_ONLY } from "./cadastro-removal";

describe("exclusão do cadastro pela IA", () => {
  it("sem nada ligado, deixa excluir", () => {
    assert.doesNotThrow(() => assertNothingLinked("a fábrica Unidade 2", NO_CADASTRO_LINKS));
  });

  it("descreve só o que está ligado, no singular e no plural", () => {
    assert.deepEqual(describeCadastroLinks({ records: 1, rps: 3, techCards: 0 }), ["1 registro (chamado, tarefa, problema ou feedback)", "3 RPs"]);
  });

  it("recusa com o nome do item e o que está ligado", () => {
    assert.throws(
      () => assertNothingLinked("a máquina Encartuchadeira", { records: 0, rps: 0, techCards: 2 }),
      (error: unknown) =>
        error instanceof DomainError && error.statusCode === 409 && /a máquina Encartuchadeira/.test(error.message) && /2 fichas de documentação técnica/.test(error.message),
    );
  });

  it("sem alternativa própria, manda para a tela", () => {
    assert.throws(() => assertNothingLinked("a fábrica Unidade 2", { records: 1, rps: 0, techCards: 0 }), new RegExp(SCREEN_ONLY));
  });
});
