import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CLOCK_HOURS, CLOCK_MINUTES, clockHour, clockMinute, parseClock, withClockHour, withClockMinute } from "./clock-text";

describe("parseClock", () => {
  it("lê horário com dois pontos, h ou ponto", () => {
    assert.equal(parseClock("14:30"), "14:30");
    assert.equal(parseClock("14h30"), "14:30");
    assert.equal(parseClock("14H30"), "14:30");
    assert.equal(parseClock("14.30"), "14:30");
    assert.equal(parseClock("9:05"), "09:05");
  });

  it("lê hora cheia", () => {
    assert.equal(parseClock("9"), "09:00");
    assert.equal(parseClock("14"), "14:00");
    assert.equal(parseClock("14h"), "14:00");
    assert.equal(parseClock("14:"), "14:00");
  });

  it("lê só números com os minutos no fim", () => {
    assert.equal(parseClock("930"), "09:30");
    assert.equal(parseClock("1430"), "14:30");
    assert.equal(parseClock("0000"), "00:00");
  });

  it("ignora espaços", () => {
    assert.equal(parseClock(" 14 : 30 "), "14:30");
  });

  it("recusa hora ou minuto fora do relógio e texto que não é horário", () => {
    assert.equal(parseClock("24"), null);
    assert.equal(parseClock("25:00"), null);
    assert.equal(parseClock("1460"), null);
    assert.equal(parseClock("14:3"), null);
    assert.equal(parseClock("12345"), null);
    assert.equal(parseClock("meio-dia"), null);
    assert.equal(parseClock(""), null);
  });
});

describe("grade do seletor", () => {
  it("tem as 24 horas e os minutos de 5 em 5", () => {
    assert.equal(CLOCK_HOURS.length, 24);
    assert.deepEqual([CLOCK_HOURS[0], CLOCK_HOURS[23]], ["00", "23"]);
    assert.deepEqual(CLOCK_MINUTES, ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]);
  });
});

describe("partes do horário", () => {
  it("separa hora e minuto, vazias sem horário", () => {
    assert.equal(clockHour("14:30"), "14");
    assert.equal(clockMinute("14:30"), "30");
    assert.equal(clockHour(""), "");
    assert.equal(clockMinute(""), "");
  });

  it("trocar a hora mantém o minuto, ou começa na hora cheia", () => {
    assert.equal(withClockHour("14:30", "08"), "08:30");
    assert.equal(withClockHour("", "08"), "08:00");
  });

  it("trocar o minuto mantém a hora e não inventa hora", () => {
    assert.equal(withClockMinute("14:30", "45"), "14:45");
    assert.equal(withClockMinute("", "45"), "");
  });
});
