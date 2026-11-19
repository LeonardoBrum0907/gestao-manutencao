import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { afterMarkedBox, leadingBox } from "./rp-marks";

describe("afterMarkedBox", () => {
  it("acha o quadrinho marcado com X, ✅, ✔️ ou ☑", () => {
    const found = ["(X) CORRIGIDO", "( X ) CORRIGIDO", "(✅) CORRIGIDO", "(✔️) CORRIGIDO", "(☑) CORRIGIDO"].map((text) => afterMarkedBox(text)?.trim());
    assert.deepEqual(found, ["CORRIGIDO", "CORRIGIDO", "CORRIGIDO", "CORRIGIDO", "CORRIGIDO"]);
  });

  it("ignora quadrinho vazio", () => {
    assert.equal(afterMarkedBox("( ) CORRIGIDO"), null);
    assert.equal(afterMarkedBox("() CORRIGIDO"), null);
  });
});

describe("leadingBox", () => {
  it("lê o quadrinho no começo da linha do 4M", () => {
    assert.deepEqual(leadingBox("(X) *MÁQUINA*"), { marked: true, rest: "*MÁQUINA*" });
    assert.deepEqual(leadingBox("()  *MÉTODO*"), { marked: false, rest: "*MÉTODO*" });
    assert.deepEqual(leadingBox("- (x) MATERIAL: bobina"), { marked: true, rest: "MATERIAL: bobina" });
  });

  it("devolve null sem quadrinho no começo", () => {
    assert.equal(leadingBox("- *MÁQUINA:* X"), null);
    assert.equal(leadingBox("Motor (X) parado"), null);
  });
});
