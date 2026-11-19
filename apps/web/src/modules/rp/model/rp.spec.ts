import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rpStatusChipClass, rpStatusLabel, rpStatusOptions } from "./rp";

describe("status do RP na tela", () => {
  it("oferece o Parado (aguardando qualificação) na lista de status", () => {
    assert.ok(rpStatusOptions.some((option) => option.value === "stopped" && option.label === "Parado (aguardando qualificação)"));
    assert.equal(rpStatusLabel("stopped"), "Parado (aguardando qualificação)");
  });

  it("selo do Parado em vermelho, para chamar atenção", () => {
    assert.ok(rpStatusChipClass("stopped").includes("text-danger"));
    assert.ok(!rpStatusChipClass("analysis").includes("text-danger"));
  });
});
