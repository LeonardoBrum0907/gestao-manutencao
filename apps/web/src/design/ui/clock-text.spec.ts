import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CLOCK_HOURS, CLOCK_MINUTES, clockHour, clockMinute, joinClock, loopedTop, startClock, typedItem, wheelIndex, wheelTop, WHEEL_COPIES } from "./clock-text";

describe("rodas do seletor", () => {
  it("têm as 24 horas e os 60 minutos", () => {
    assert.equal(CLOCK_HOURS.length, 24);
    assert.deepEqual([CLOCK_HOURS[0], CLOCK_HOURS[23]], ["00", "23"]);
    assert.equal(CLOCK_MINUTES.length, 60);
    assert.deepEqual([CLOCK_MINUTES[0], CLOCK_MINUTES[5], CLOCK_MINUTES[59]], ["00", "05", "59"]);
  });

  it("repete a lista um número ímpar de vezes, para ter uma cópia no meio", () => {
    assert.equal(WHEEL_COPIES % 2, 1);
  });
});

describe("partes do horário", () => {
  it("separa e junta hora e minuto", () => {
    assert.equal(clockHour("14:30"), "14");
    assert.equal(clockMinute("14:30"), "30");
    assert.equal(clockHour(""), "");
    assert.equal(joinClock("08", "05"), "08:05");
  });
});

describe("startClock", () => {
  it("começa agora em Brasília, nos 5 minutos seguintes", () => {
    assert.equal(startClock(new Date("2026-10-29T17:32:00Z")), "14:35");
    assert.equal(startClock(new Date("2026-10-29T17:30:00Z")), "14:30");
  });

  it("passa da hora e da meia-noite", () => {
    assert.equal(startClock(new Date("2026-10-29T17:57:00Z")), "15:00");
    assert.equal(startClock(new Date("2026-10-30T02:58:00Z")), "00:00");
  });
});

describe("posição da roda", () => {
  it("põe o item no centro, na cópia do meio, e lê de volta", () => {
    const top = wheelTop(14, 24, 36);
    assert.equal(top, (3 * 24 + 14) * 36);
    assert.equal(wheelIndex(top, 36, 24), 14);
  });

  it("arredonda para a linha mais perto", () => {
    assert.equal(wheelIndex(wheelTop(14, 24, 36) + 17, 36, 24), 14);
    assert.equal(wheelIndex(wheelTop(14, 24, 36) + 19, 36, 24), 15);
  });

  it("dá a volta: depois do 23 vem o 00 e antes do 00 vem o 23", () => {
    assert.equal(wheelIndex(wheelTop(23, 24, 36) + 36, 36, 24), 0);
    assert.equal(wheelIndex(wheelTop(0, 24, 36) - 36, 36, 24), 23);
  });

  it("volta para a cópia do meio sem mudar o item do centro", () => {
    const cycle = 24 * 36;
    assert.equal(loopedTop(wheelTop(5, 24, 36) + 2 * cycle, 24, 36), wheelTop(5, 24, 36));
    assert.equal(loopedTop(wheelTop(5, 24, 36) - 3 * cycle, 24, 36), wheelTop(5, 24, 36));
    assert.equal(loopedTop(wheelTop(5, 24, 36), 24, 36), wheelTop(5, 24, 36));
  });
});

describe("typedItem", () => {
  it("lê um ou dois números", () => {
    assert.equal(typedItem("7", CLOCK_HOURS), "07");
    assert.equal(typedItem("14", CLOCK_HOURS), "14");
    assert.equal(typedItem("45", CLOCK_MINUTES), "45");
  });

  it("fica com o último número quando os dois juntos não existem", () => {
    assert.equal(typedItem("75", CLOCK_HOURS), "05");
    assert.equal(typedItem("147", CLOCK_HOURS), "07");
  });
});
