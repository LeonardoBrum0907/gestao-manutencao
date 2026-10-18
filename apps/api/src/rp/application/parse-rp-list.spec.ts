import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseRpList } from "./parse-rp-list";

describe("parseRpList", () => {
  it("sem filtro: lista tudo, 50 por página", () => {
    const filter = parseRpList({});
    assert.equal(filter.limit, 50);
    assert.equal(filter.source, null);
    assert.equal(filter.reviewPending, false);
    assert.equal(filter.statuses, null);
  });

  it("lê vários status separados por vírgula", () => {
    assert.deepEqual(parseRpList({ status: "analysis,monitoring" }).statuses, ["analysis", "monitoring"]);
  });

  it("filtra pela origem", () => {
    assert.equal(parseRpList({ source: "public" }).source, "public");
    assert.equal(parseRpList({ source: "paste" }).source, "paste");
    assert.throws(() => parseRpList({ source: "whatsapp" }), /Origem inválida \(recebido: whatsapp/);
  });

  it("review=pending: só os com pedido de revisão", () => {
    assert.equal(parseRpList({ review: "pending" }).reviewPending, true);
    assert.throws(() => parseRpList({ review: "sim" }), /esperado: pending/);
  });

  it("checked=true|false: só conferidos ou só não conferidos", () => {
    assert.equal(parseRpList({}).checked, null);
    assert.equal(parseRpList({ checked: "true" }).checked, true);
    assert.equal(parseRpList({ checked: "false" }).checked, false);
    assert.throws(() => parseRpList({ checked: "sim" }), /recebido: sim; esperado: true ou false/);
  });

  it("limite fora de 1 a 100 é recusado", () => {
    assert.throws(() => parseRpList({ limit: "0" }), /de 1 a 100/);
  });
});
