import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FakeSupervisorLinkStore } from "./fake-public-rp-stores";
import { parseSupervisorName, SupervisorLinks } from "./supervisor-links";

const NOW = new Date("2026-10-18T23:00:00Z");

describe("SupervisorLinks", () => {
  it("cria um link por supervisor, cada um com o seu código", async () => {
    const links = new SupervisorLinks(new FakeSupervisorLinkStore(), () => NOW);
    const carlos = await links.create({ name: " Carlos " });
    const ana = await links.create({ name: "Ana" });
    assert.equal(carlos.name, "Carlos");
    assert.notEqual(carlos.code, ana.code);
    assert.deepEqual((await links.list()).map((link) => link.name), ["Carlos", "Ana"]);
  });

  it("trocar dá outro código ao mesmo supervisor; remover tira da lista", async () => {
    const store = new FakeSupervisorLinkStore();
    const links = new SupervisorLinks(store, () => NOW);
    const carlos = await links.create({ name: "Carlos" });
    const replaced = await links.replace(carlos.id);
    assert.equal(replaced.name, "Carlos");
    assert.notEqual(replaced.code, carlos.code);
    assert.equal(await store.findActive(carlos.code), null);
    await links.revoke(carlos.id);
    assert.deepEqual(await links.list(), []);
    await assert.rejects(links.replace(carlos.id), /não encontrado.*sup1/);
  });

  it("nome vazio ou longo demais é recusado com o tamanho", () => {
    assert.throws(() => parseSupervisorName({ name: "  " }), /Escreva o nome/);
    assert.throws(() => parseSupervisorName({ name: "x".repeat(61) }), /61 caracteres; até 60/);
  });
});
