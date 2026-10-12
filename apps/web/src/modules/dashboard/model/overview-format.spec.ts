import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { barShare, compareTo, niceCeiling, formatDuration, minutesSince, shortDate, weekLabel } from "./overview-format";

describe("números do Dashboard", () => {
  it("conta minutos desde a abertura, sem negativo", () => {
    const now = new Date("2026-10-12T15:30:00.000Z");
    assert.equal(minutesSince("2026-10-12T13:00:00.000Z", now), 150);
    assert.equal(minutesSince("2026-10-12T16:00:00.000Z", now), 0);
  });

  it("escreve a duração curta", () => {
    assert.equal(formatDuration(45), "45 min");
    assert.equal(formatDuration(120), "2 h");
    assert.equal(formatDuration(130), "2 h 10 min");
    assert.equal(formatDuration(1500), "1 d 1 h");
    assert.equal(formatDuration(2880), "2 d");
  });

  it("compara com o período anterior", () => {
    assert.deepEqual(compareTo(41, 43), { diff: -2, direction: "down" });
    assert.deepEqual(compareTo(5, 5), { diff: 0, direction: "same" });
    assert.equal(compareTo(null, 5), null);
  });

  it("rótulos de semana e de dia", () => {
    assert.equal(weekLabel("2026-10-05"), "05/10");
    assert.equal(shortDate("2026-10-08T02:00:00.000Z"), "07/10");
  });

  it("barra proporcional ao maior", () => {
    assert.equal(barShare(3, 12), 25);
    assert.equal(barShare(0, 0), 0);
  });

  it("arredonda o topo do eixo para cima", () => {
    assert.equal(niceCeiling(13), 20);
    assert.equal(niceCeiling(5), 5);
    assert.equal(niceCeiling(51), 100);
    assert.equal(niceCeiling(0), 1);
  });
});
