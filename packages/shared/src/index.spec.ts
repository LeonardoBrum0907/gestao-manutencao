import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MEMBER_POSITION_LABELS } from "./index";

describe("nomes do cargo", () => {
  // O PR #110 trocou "Técnico" por "Eletricista" aqui sem querer: todo mecânico aparecia como eletricista.
  it("chama o técnico de Técnico, seja ele mecânico ou eletricista", () => {
    assert.equal(MEMBER_POSITION_LABELS.technician, "Técnico");
    assert.equal(MEMBER_POSITION_LABELS.supervisor, "Supervisor");
  });
});
