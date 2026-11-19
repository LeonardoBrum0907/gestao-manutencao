import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyRpValues } from "./rp";
import { openPasteWarnings } from "./rp-paste-warnings";

const noDate = "Data não encontrada: confira a data.";
const noLine = "Linha não encontrada no cadastro: ficou só com a linha e a TAG do texto. Escolha a fábrica antes de salvar.";
const noTech = "Técnico não informado.";
const many = "O texto tem 2 relatórios: preenchi o primeiro. Cole os outros depois de gravar.";
const initial = { ...emptyRpValues(), occurredAt: "" };

describe("avisos do Colar que ainda valem", () => {
  it("sem mudança na tela, todos ficam", () => {
    assert.deepEqual(openPasteWarnings([noDate, noLine, noTech, many], initial, initial), [noDate, noLine, noTech, many]);
  });

  it("some o aviso da data quando a pessoa preenche a data", () => {
    assert.deepEqual(openPasteWarnings([noDate, noTech], initial, { ...initial, occurredAt: "2026-11-18" }), [noTech]);
  });

  it("aviso da linha some ao escolher a linha ou a fábrica", () => {
    assert.deepEqual(openPasteWarnings([noLine], initial, { ...initial, lineId: "l1" }), []);
    assert.deepEqual(openPasteWarnings([noLine], initial, { ...initial, factoryId: "f1" }), []);
  });

  it("aviso do técnico some ao escolher alguém", () => {
    assert.deepEqual(openPasteWarnings([noTech], initial, { ...initial, memberIds: ["m1"] }), []);
  });

  it("apagar o campo de novo traz o aviso de volta", () => {
    const withDate = { ...initial, occurredAt: "2026-11-18" };
    assert.deepEqual(openPasteWarnings([noDate], withDate, { ...withDate, occurredAt: "" }), [noDate]);
  });

  it("aviso de data sem ano some quando a pessoa troca a data lida", () => {
    const guessed = { ...initial, occurredAt: "2026-11-18" };
    const warning = "Data sem ano: usei 2026. Confira a data.";
    assert.deepEqual(openPasteWarnings([warning], guessed, guessed), [warning]);
    assert.deepEqual(openPasteWarnings([warning], guessed, { ...guessed, occurredAt: "2025-11-18" }), []);
  });

  it("aviso sem campo, como o de vários relatórios, não some", () => {
    assert.deepEqual(openPasteWarnings([many], initial, { ...initial, occurredAt: "2026-11-18", lineId: "l1" }), [many]);
  });
});
