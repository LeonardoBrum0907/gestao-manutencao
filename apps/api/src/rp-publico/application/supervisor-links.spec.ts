import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FakeSupervisorLinkStore } from "./fake-public-rp-stores";
import { parseSupervisorMemberId, SupervisorLinks } from "./supervisor-links";

const NOW = new Date("2026-10-18T23:00:00Z");

describe("SupervisorLinks", () => {
  it("cria um link por supervisor do cadastro, cada um com o seu código", async () => {
    const links = new SupervisorLinks(new FakeSupervisorLinkStore(), () => NOW);
    const carlos = await links.create({ memberId: "m-carlos" });
    const ana = await links.create({ memberId: "m-ana" });
    assert.deepEqual([carlos.name, carlos.memberId], ["Carlos", "m-carlos"]);
    assert.notEqual(carlos.code, ana.code);
    assert.deepEqual((await links.list()).map((link) => link.name), ["Carlos", "Ana"]);
  });

  it("recusa quem não é supervisor e um segundo link para o mesmo supervisor", async () => {
    const links = new SupervisorLinks(new FakeSupervisorLinkStore(), () => NOW);
    await assert.rejects(links.create({ memberId: "m-tecnico" }), /m-tecnico não é supervisor/);
    await links.create({ memberId: "m-carlos" });
    await assert.rejects(links.create({ memberId: "m-carlos" }), /Carlos já tem link/);
  });

  it("depois de remover, o supervisor pode ganhar um link novo", async () => {
    const links = new SupervisorLinks(new FakeSupervisorLinkStore(), () => NOW);
    const first = await links.create({ memberId: "m-carlos" });
    await links.revoke(first.id);
    const second = await links.create({ memberId: "m-carlos" });
    assert.notEqual(second.code, first.code);
  });

  it("trocar dá outro código ao mesmo supervisor; remover tira da lista", async () => {
    const store = new FakeSupervisorLinkStore();
    const links = new SupervisorLinks(store, () => NOW);
    const carlos = await links.create({ memberId: "m-carlos" });
    const replaced = await links.replace(carlos.id);
    assert.equal(replaced.name, "Carlos");
    assert.notEqual(replaced.code, carlos.code);
    assert.equal(await store.findActive(carlos.code), null);
    await links.revoke(carlos.id);
    assert.deepEqual(await links.list(), []);
    await assert.rejects(links.replace(carlos.id), /não encontrado.*sup1/);
  });

  it("sem supervisor escolhido, pede para escolher", () => {
    assert.throws(() => parseSupervisorMemberId({}), /Escolha o supervisor/);
    assert.equal(parseSupervisorMemberId({ memberId: "m1" }), "m1");
  });
});
