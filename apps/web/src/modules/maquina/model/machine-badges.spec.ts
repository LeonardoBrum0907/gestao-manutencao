import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { machineBadges } from "./machine-badges";

describe("avisos da máquina na lista do celular", () => {
  it("mostra a parada junto com os pontos ativos (antes a parada sumia)", () => {
    assert.deepEqual(machineBadges("stopped", 1), ["stopped", "points"]);
  });

  it("mostra só o que existe", () => {
    assert.deepEqual(machineBadges("stopped", 0), ["stopped"]);
    assert.deepEqual(machineBadges("released", 2), ["points"]);
    assert.deepEqual(machineBadges("released", 0), []);
  });
});
