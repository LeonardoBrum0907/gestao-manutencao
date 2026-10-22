import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasPublicRpFilters, hiddenPublicRpFiltersInUse, withoutPublicRpFilters } from "./public-rp-filters";

describe("filtros da lista pública", () => {
  it("Quem sou e o pedido de revisão não contam como filtro do cartão", () => {
    assert.equal(hasPublicRpFilters(new URLSearchParams("memberId=m1&review=pending"), false), false);
    assert.equal(hasPublicRpFilters(new URLSearchParams("memberId=m1&repeated=true"), false), true);
  });

  it("conta os escondidos no celular sem a busca", () => {
    const params = new URLSearchParams("q=motor&lineId=l1&tag=EBS&from=2026-10-01&to=2026-10-22");
    assert.equal(hiddenPublicRpFiltersInUse(params, false), 4);
  });

  it("na exportação a avaliação presa em Aprovado não conta nem sai ao limpar", () => {
    const params = new URLSearchParams("export=1&decision=approved");
    assert.equal(hasPublicRpFilters(params, true), false);
    assert.equal(hiddenPublicRpFiltersInUse(params, true), 0);
    params.set("tag", "EBS");
    assert.equal(withoutPublicRpFilters(params, true).toString(), "export=1&decision=approved");
  });

  it("limpar tira os filtros do cartão e guarda Quem sou e a revisão", () => {
    const params = new URLSearchParams("memberId=m1&review=pending&decision=rejected&status=stopped&lineId=l1&tag=EBS&repeated=false&q=x");
    assert.equal(withoutPublicRpFilters(params, false).toString(), "memberId=m1&review=pending");
  });
});
