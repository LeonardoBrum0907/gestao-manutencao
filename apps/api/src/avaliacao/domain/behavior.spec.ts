import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BehaviorTagDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { normalizeBehavior, orderTags, storedBehavior } from "./behavior";
import { assertBehaviorTagCanBeRemoved, sortBehaviorTags } from "./behavior-tag-catalog";

const blank = { punctuality: null, productivity: null, collaboration: null, tags: [] };

const catalog: BehaviorTagDto[] = [
  { id: "proactive", group: "strengths", name: "Proativo", archived: false },
  { id: "missed_deadlines", group: "attention", name: "Prazos perdidos", archived: false },
  { id: "new_to_team", group: "situation", name: "Novo na equipe", archived: false },
  { id: "old", group: "situation", name: "Em experiência", archived: true },
];

function isDomain(status: number) {
  return (error: unknown) => error instanceof DomainError && error.statusCode === status;
}

describe("comportamento", () => {
  it("aceita avaliações do catálogo e deixa em branco o que não foi avaliado", () => {
    assert.deepEqual(normalizeBehavior({ ...blank, punctuality: "good", productivity: "high" }, catalog, []), {
      punctuality: "good",
      productivity: "high",
      collaboration: null,
      tags: [],
    });
  });

  it("tira etiqueta repetida e põe na ordem do cadastro", () => {
    const behavior = normalizeBehavior({ ...blank, tags: ["new_to_team", "proactive", "missed_deadlines", "proactive"] }, catalog, []);
    assert.deepEqual(behavior.tags, ["proactive", "missed_deadlines", "new_to_team"]);
  });

  it("recusa valor fora do catálogo", () => {
    for (const input of [
      { ...blank, punctuality: "ótima" },
      { ...blank, productivity: "excellent" },
      { ...blank, collaboration: "high" },
      { ...blank, tags: ["preguiçoso"] },
    ]) {
      assert.throws(() => normalizeBehavior(input, catalog, []), isDomain(400));
    }
  });

  it("opção arquivada não entra em ficha nova, mas fica em quem já tinha", () => {
    assert.throws(() => normalizeBehavior({ ...blank, tags: ["old"] }, catalog, []), isDomain(409));
    assert.deepEqual(normalizeBehavior({ ...blank, tags: ["old", "proactive"] }, catalog, ["old"]).tags, ["proactive", "old"]);
  });

  it("na leitura, etiqueta que saiu do cadastro some e valor estranho vira em branco", () => {
    assert.deepEqual(orderTags(["sumiu", "new_to_team", "proactive"], catalog), ["proactive", "new_to_team"]);
    assert.equal(storedBehavior({ ...blank, punctuality: "ótima" }).punctuality, null);
  });
});

describe("cadastro de opções do comportamento", () => {
  it("ordena por categoria e depois pela posição", () => {
    const rows = [
      { id: "a", group: "situation", position: 1, name: "A" },
      { id: "b", group: "strengths", position: 2, name: "B" },
      { id: "c", group: "attention", position: 1, name: "C" },
      { id: "d", group: "strengths", position: 1, name: "D" },
    ];
    assert.deepEqual(sortBehaviorTags(rows).map((row) => row.id), ["d", "b", "c", "a"]);
  });

  it("marcada em alguma ficha, não exclui: pede para arquivar", () => {
    assert.doesNotThrow(() => assertBehaviorTagCanBeRemoved(0));
    assert.throws(() => assertBehaviorTagCanBeRemoved(2), (error: unknown) => error instanceof DomainError && /2 colaboradores/.test(error.message));
  });
});
