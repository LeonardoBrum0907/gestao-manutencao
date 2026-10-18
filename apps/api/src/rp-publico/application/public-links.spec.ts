import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FakePublicLinkStore, FakeSupervisorLinkStore } from "./fake-public-rp-stores";
import { PublicLinks } from "./public-links";

const NOW = new Date("2026-10-18T15:00:00Z");

describe("PublicLinks", () => {
  it("gerar outro link desliga o anterior", async () => {
    const store = new FakePublicLinkStore();
    const links = new PublicLinks(store, new FakeSupervisorLinkStore(), () => NOW);
    const first = (await links.replace()).link!;
    const second = (await links.replace()).link!;
    assert.notEqual(first.code, second.code);
    await assert.rejects(links.assertActive(first.code), /não vale mais/);
    await assert.doesNotReject(links.assertActive(second.code));
  });

  it("desligar deixa a página sem link", async () => {
    const store = new FakePublicLinkStore();
    const links = new PublicLinks(store, new FakeSupervisorLinkStore(), () => NOW);
    const { link } = await links.replace();
    assert.deepEqual(await links.disable(), { link: null });
    await assert.rejects(links.assertActive(link!.code), /não vale mais/);
    assert.deepEqual(await links.state(), { link: null });
  });

  it("link de supervisor abre a página e diz quem é; o da equipe não avalia", async () => {
    const supervisors = new FakeSupervisorLinkStore();
    const links = new PublicLinks(new FakePublicLinkStore(), supervisors, () => NOW);
    const team = (await links.replace()).link!.code;
    const carlos = await supervisors.create("Carlos", "c".repeat(24), NOW);
    assert.deepEqual(await links.assertActive(team), { role: "team" });
    assert.deepEqual(await links.assertActive(carlos.code), { role: "supervisor", supervisorName: "Carlos" });
    assert.equal(await links.assertSupervisor(carlos.code), "Carlos");
    await assert.rejects(links.assertSupervisor(team), /link de um supervisor/);
  });

  it("link de supervisor removido para de abrir, mesmo com o da equipe ligado", async () => {
    const supervisors = new FakeSupervisorLinkStore();
    const links = new PublicLinks(new FakePublicLinkStore(), supervisors, () => NOW);
    await links.replace();
    const carlos = await supervisors.create("Carlos", "c".repeat(24), NOW);
    await supervisors.revoke(carlos.id, NOW);
    await assert.rejects(links.assertActive(carlos.code), /não vale mais/);
  });
});
