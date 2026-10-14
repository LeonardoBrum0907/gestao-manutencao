import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BehaviorTagDto } from "@manutencao/shared";
import { behaviorTagChoices, replaceGroupTags } from "./behavior-tags";

function tag(id: string, scope: Partial<BehaviorTagDto> = {}): BehaviorTagDto {
  return { id, group: "strengths", name: id, archived: false, ...scope };
}

describe("opções do select de Comportamento", () => {
  const catalog = [tag("proativo"), tag("antiga", { archived: true }), tag("prazos", { group: "attention" })];

  it("mostra só a categoria pedida, sem arquivadas", () => {
    assert.deepEqual(behaviorTagChoices(catalog, "strengths", []), [{ value: "proativo", label: "proativo" }]);
  });

  it("mantém a arquivada em quem já tinha, com aviso no nome", () => {
    assert.deepEqual(
      behaviorTagChoices(catalog, "strengths", ["antiga"]).map((choice) => choice.label),
      ["proativo", "antiga (arquivada)"],
    );
  });
});

describe("troca das marcadas de uma categoria", () => {
  it("troca a categoria e preserva as outras", () => {
    assert.deepEqual(replaceGroupTags(["proativo", "prazos"], ["proativo", "organizado"], ["organizado"]), ["prazos", "organizado"]);
  });

  it("limpar a categoria não mexe nas outras", () => {
    assert.deepEqual(replaceGroupTags(["proativo", "prazos"], ["proativo"], []), ["prazos"]);
  });
});
