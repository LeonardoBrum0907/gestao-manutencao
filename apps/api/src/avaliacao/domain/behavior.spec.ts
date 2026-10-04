import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { normalizeBehavior } from "./behavior";

const blank = { punctuality: null, productivity: null, collaboration: null, tags: [] };

describe("comportamento", () => {
  it("aceita avaliações do catálogo e deixa em branco o que não foi avaliado", () => {
    assert.deepEqual(normalizeBehavior({ ...blank, punctuality: "good", productivity: "high" }), {
      punctuality: "good",
      productivity: "high",
      collaboration: null,
      tags: [],
    });
  });

  it("tira etiqueta repetida e põe na ordem do catálogo", () => {
    const behavior = normalizeBehavior({ ...blank, tags: ["new_to_team", "proactive", "missed_deadlines", "proactive"] });
    assert.deepEqual(behavior.tags, ["proactive", "missed_deadlines", "new_to_team"]);
  });

  it("recusa valor fora do catálogo", () => {
    for (const input of [
      { ...blank, punctuality: "ótima" },
      { ...blank, productivity: "excellent" },
      { ...blank, collaboration: "high" },
      { ...blank, tags: ["preguiçoso"] },
    ]) {
      assert.throws(() => normalizeBehavior(input), (error: unknown) => error instanceof DomainError && error.statusCode === 400);
    }
  });
});
