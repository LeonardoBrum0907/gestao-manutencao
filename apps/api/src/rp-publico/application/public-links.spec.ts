import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FakePublicLinkStore } from "./fake-public-rp-stores";
import { PublicLinks } from "./public-links";

const NOW = new Date("2026-10-18T15:00:00Z");

describe("PublicLinks", () => {
  it("gerar outro link desliga o anterior", async () => {
    const store = new FakePublicLinkStore();
    const links = new PublicLinks(store, () => NOW);
    const first = (await links.replace()).link!;
    const second = (await links.replace()).link!;
    assert.notEqual(first.code, second.code);
    await assert.rejects(links.assertActive(first.code), /não vale mais/);
    await assert.doesNotReject(links.assertActive(second.code));
  });

  it("desligar deixa a página sem link", async () => {
    const store = new FakePublicLinkStore();
    const links = new PublicLinks(store, () => NOW);
    const { link } = await links.replace();
    assert.deepEqual(await links.disable(), { link: null });
    await assert.rejects(links.assertActive(link!.code), /não vale mais/);
    assert.deepEqual(await links.state(), { link: null });
  });
});
