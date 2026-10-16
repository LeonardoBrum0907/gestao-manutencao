import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { machineStatusFilter } from "./machine-status-filter";

describe("machineStatusFilter", () => {
  it("devolve a situação pedida no endereço", () => {
    assert.equal(machineStatusFilter("stopped"), "stopped");
    assert.equal(machineStatusFilter("implanting"), "implanting");
  });

  it("sem pedido ou com valor desconhecido, não filtra", () => {
    assert.equal(machineStatusFilter(null), null);
    assert.equal(machineStatusFilter(""), null);
    assert.equal(machineStatusFilter("parada"), null);
  });
});
