import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clampInterval, customOfRepeat, repeatOfCustom, repeatUnitLabel } from "./repeat-custom";

// 2026-11-04 é quarta-feira.
const anchor = "2026-11-04";

describe("repetir: Personalizar", () => {
  it("sem regra começa toda semana no dia do prazo, sem fim", () => {
    assert.deepEqual(repeatOfCustom(customOfRepeat(null, anchor)), { every: "week", interval: 1, weekdays: [3], since: anchor });
  });

  it("a cada 3 dias conta do início da série e leva a data final", () => {
    const custom = { ...customOfRepeat(null, anchor), unit: "day" as const, interval: 3, until: "2026-12-31" };
    assert.deepEqual(repeatOfCustom(custom), { every: "day", interval: 3, since: anchor, until: "2026-12-31" });
  });

  it("a cada 1 mês sai igual à opção pronta Todo mês", () => {
    assert.deepEqual(repeatOfCustom({ ...customOfRepeat(null, anchor), unit: "month" }), { every: "month", dayOfMonth: 4 });
  });

  it("abre a regra gravada com o que ela tem; dias úteis viram seg a sex", () => {
    const opened = customOfRepeat({ every: "month", dayOfMonth: 10, interval: 2, since: "2026-10-10", until: "2027-06-30" }, anchor);
    assert.deepEqual(opened, { unit: "month", interval: 2, weekdays: [3], dayOfMonth: 10, since: "2026-10-10", until: "2027-06-30" });
    assert.deepEqual(customOfRepeat({ every: "workday" }, anchor).weekdays, [1, 2, 3, 4, 5]);
  });

  it("a cada fica entre 1 e o máximo da unidade", () => {
    assert.equal(clampInterval("week", 99), 52);
    assert.equal(clampInterval("day", 0), 1);
    assert.equal(clampInterval("month", Number("abc")), 1);
  });

  it("unidade no singular e no plural", () => {
    assert.equal(repeatUnitLabel("month", 1), "mês");
    assert.equal(repeatUnitLabel("month", 3), "meses");
  });
});
