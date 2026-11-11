import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runOnEnter, type EnterKeyEvent } from "./enter-key";

class FakeKeyEvent implements EnterKeyEvent {
  prevented = false;
  nativeEvent: { isComposing: boolean };

  constructor(readonly key: string, composing = false) {
    this.nativeEvent = { isComposing: composing };
  }

  preventDefault(): void {
    this.prevented = true;
  }
}

// Regressão: Enter no nome do "+ Novo subconjunto" enviava a ficha inteira (gravava a pós-preventiva ou o RP)
// e não criava o subconjunto.
describe("Enter num campo dentro de um formulário maior", () => {
  it("roda a ação do campo e não deixa o formulário ser enviado", () => {
    const event = new FakeKeyEvent("Enter");
    let runs = 0;
    runOnEnter(event, () => runs++);
    assert.equal(runs, 1);
    assert.equal(event.prevented, true);
  });

  it("outras teclas seguem normais", () => {
    const event = new FakeKeyEvent("a");
    let runs = 0;
    runOnEnter(event, () => runs++);
    assert.equal(runs, 0);
    assert.equal(event.prevented, false);
  });

  it("Enter que só confirma o acento ou a sugestão do teclado (composição) não roda a ação", () => {
    const event = new FakeKeyEvent("Enter", true);
    let runs = 0;
    runOnEnter(event, () => runs++);
    assert.equal(runs, 0);
    assert.equal(event.prevented, false);
  });
});
