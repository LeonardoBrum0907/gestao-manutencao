import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gestorToday, readRpDate } from "./rp-date";

const TODAY = "2026-11-19";

describe("readRpDate", () => {
  it("lê dia/mês/ano com barra, ponto, traço e ano de dois dígitos", () => {
    const days = ["18/11/2026", "18.11.2026", "18-11-26", "17/11/2026.", "18/11/2026 às 14h"].map((text) => readRpDate(text, TODAY).date);
    assert.deepEqual(days, ["2026-11-18", "2026-11-18", "2026-11-18", "2026-11-17", "2026-11-18"]);
  });

  // Antes lia "2026-11-18" como 26/11/2018, sem aviso.
  it("lê ano-mês-dia", () => {
    assert.deepEqual(readRpDate("2026-11-18", TODAY), { date: "2026-11-18", guessedYear: false });
  });

  it("completa a data sem ano com o ano de hoje, ou o anterior quando cairia no futuro", () => {
    assert.deepEqual(readRpDate("18/11", TODAY), { date: "2026-11-18", guessedYear: true });
    assert.deepEqual(readRpDate("25/12", TODAY), { date: "2025-12-25", guessedYear: true });
  });

  it("devolve null para data que não existe ou texto sem data", () => {
    assert.deepEqual(readRpDate("31/02/2026", TODAY), { date: null, guessedYear: false });
    assert.deepEqual(readRpDate("31/02", TODAY), { date: null, guessedYear: false });
    assert.deepEqual(readRpDate("ontem", TODAY), { date: null, guessedYear: false });
  });
});

describe("gestorToday", () => {
  it("usa o fuso de Brasília", () => {
    assert.equal(gestorToday(new Date("2026-11-19T01:00:00Z")), "2026-11-18");
    assert.equal(gestorToday(new Date("2026-11-19T12:00:00Z")), "2026-11-19");
  });
});
