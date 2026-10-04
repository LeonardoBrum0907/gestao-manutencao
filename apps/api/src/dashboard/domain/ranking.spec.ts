import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RANK_LIMIT, rankOpen } from "./ranking";

describe("ranking do painel", () => {
  it("ordena por abertos e desempata pelo nome", () => {
    const names = new Map([["a", "Prensa"], ["b", "Torno"], ["c", "Caldeira"]]);
    const ranked = rankOpen([{ id: "a", openCount: 2 }, { id: "b", openCount: 5 }, { id: "c", openCount: 2 }], names);
    assert.deepEqual(ranked.map((row) => row.id), ["b", "c", "a"]);
  });

  it("com nome e contagem iguais, desempata pelo id para a ordem não variar", () => {
    const names = new Map([["b", "Torno"], ["a", "Torno"]]);
    const ranked = rankOpen([{ id: "b", openCount: 1 }, { id: "a", openCount: 1 }], names);
    assert.deepEqual(ranked.map((row) => row.id), ["a", "b"]);
  });

  it("ignora o que não está mais no cadastro e corta no limite", () => {
    const names = new Map(Array.from({ length: 8 }, (_, index) => [`m${index}`, `M${index}`] as const));
    const counts = [{ id: "fantasma", openCount: 99 }, ...Array.from({ length: 8 }, (_, index) => ({ id: `m${index}`, openCount: index + 1 }))];
    const ranked = rankOpen(counts, names);
    assert.equal(ranked.length, RANK_LIMIT);
    assert.equal(ranked.some((row) => row.id === "fantasma"), false);
    assert.equal(ranked[0]?.id, "m7");
  });
});
