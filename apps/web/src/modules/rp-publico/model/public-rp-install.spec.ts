import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { publicStartTarget, rememberPublicCode, rememberedPublicCode } from "./public-rp-install";

const CODE = "k8F3qP0zLm2xV7sR9tW1yB4n";

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
  it("guarda o código e o login acha a página dele", () => {
    const storage = new FakeDeviceStorage();
    rememberPublicCode(storage, CODE);
    assert.equal(rememberedPublicCode(storage), CODE);
    assert.equal(publicStartTarget(storage), `/rp/abrir/${CODE}`);
  });

  it("sem link guardado não há para onde ir", () => {
    assert.equal(publicStartTarget(new FakeDeviceStorage()), null);
    assert.equal(publicStartTarget(null), null);
  });

  it("ignora código fora do formato da API", () => {
    const storage = new FakeDeviceStorage();
    rememberPublicCode(storage, "novo");
    assert.equal(rememberedPublicCode(storage), "");
    storage.items.set("rp-publico-link", "../login");
    assert.equal(rememberedPublicCode(storage), "");
  });

  it("armazenamento bloqueado não quebra a tela", () => {
    assert.doesNotThrow(() => rememberPublicCode(new BlockedDeviceStorage(), CODE));
    assert.equal(rememberedPublicCode(new BlockedDeviceStorage()), "");
  });
});
