import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { openChamadosLink } from "./open-chamados-link";

describe("link dos chamados abertos no Dashboard", () => {
  it("sem chamado aberto, vai para os chamados de hoje", () => {
    assert.equal(openChamadosLink([]), "/turno/chamados");
  });

  it("vai para o dia do chamado aberto mais antigo, em qualquer ordem", () => {
    const chamados = [{ openedAt: "2026-10-15T12:00:00.000Z" }, { openedAt: "2026-10-13T20:00:00.000Z" }];
    assert.equal(openChamadosLink(chamados), "/turno/chamados?dia=2026-10-13");
  });

  it("usa o dia de Brasília: 23h30 do dia 14 ainda é dia 14", () => {
    assert.equal(openChamadosLink([{ openedAt: "2026-10-15T02:30:00.000Z" }]), "/turno/chamados?dia=2026-10-14");
  });
});
