import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { publicCodeFromLink, publicStartTarget, rememberPublicCode, rememberedPublicCode } from "./public-rp-install";

class FakeDeviceStorage {
  items = new Map<string, string>();
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

class BlockedDeviceStorage {
  getItem(): string | null {
    throw new Error("bloqueado");
  }
  setItem(): void {
    throw new Error("bloqueado");
  }
}

describe("link guardado no aparelho", () => {
  it("guarda o código e o app instalado abre a página dele", () => {
    const storage = new FakeDeviceStorage();
    rememberPublicCode(storage, "k8F3abcd_-12");
    assert.equal(rememberedPublicCode(storage), "k8F3abcd_-12");
    assert.equal(publicStartTarget(storage), "/rp/abrir/k8F3abcd_-12");
  });

  it("sem link guardado não há para onde ir", () => {
    assert.equal(publicStartTarget(new FakeDeviceStorage()), null);
    assert.equal(publicStartTarget(null), null);
  });

  it("ignora código fora do formato da API", () => {
    const storage = new FakeDeviceStorage();
    rememberPublicCode(storage, "novo");
    storage.items.set("rp-publico-link", "../login");
    assert.equal(rememberedPublicCode(storage), "");
  });

  it("armazenamento bloqueado não quebra a tela", () => {
    assert.doesNotThrow(() => rememberPublicCode(new BlockedDeviceStorage(), "k8F3abcd"));
    assert.equal(rememberedPublicCode(new BlockedDeviceStorage()), "");
  });
});

describe("publicCodeFromLink", () => {
  it("aceita o endereço inteiro, o caminho ou só o código", () => {
    assert.equal(publicCodeFromLink(" https://gestao-manutencao.vercel.app/rp/abrir/k8F3abcd/novo "), "k8F3abcd");
    assert.equal(publicCodeFromLink("/rp/abrir/k8F3abcd?x=1"), "k8F3abcd");
    assert.equal(publicCodeFromLink("k8F3abcd"), "k8F3abcd");
  });

  it("devolve vazio quando o texto não é um link da página", () => {
    assert.equal(publicCodeFromLink("https://gestao-manutencao.vercel.app/meu-dia"), "");
    assert.equal(publicCodeFromLink(""), "");
  });
});
