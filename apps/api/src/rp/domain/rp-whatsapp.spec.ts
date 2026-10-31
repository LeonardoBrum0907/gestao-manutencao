import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rpWhatsappText, type RpWhatsappInput } from "@manutencao/shared";
import { parseRpText } from "./rp-text";

// O botão "Copiar para o WhatsApp" da página pública gera o texto; quem colar no app tem de ver o mesmo RP.

const empty = { marked: false, text: null };

function fullRp(): RpWhatsappInput {
  return {
    occurredAt: "2026-10-04T12:00:00.000Z",
    line: "blisterflex ONC",
    tag: "EBS-ONC-02",
    orderNumber: "4500123",
    problem: "Deformação de bolhas durante o corte.",
    description: "Bolhas íntegras até a faca.\nDeformavam no corte.",
    repeatedFailure: true,
    repeatedTimes: "3",
    repeatedPeriod: "última semana",
    causes: { material: empty, machine: { marked: true, text: "FERRAMENTAL" }, method: { marked: true, text: null }, labor: empty },
    rootCause: "Avanço excessivo das hastes das ventosas.",
    corrective: "Recuo de 3 hastes.\nSubstituída uma haste.",
    preventive: "Informar o preparador do ferramental.",
    status: "monitoring",
    technicians: ["Rogério B", "Douglas"],
    basicConditionImpact: "Sim",
  };
}

function roundTrip(input: RpWhatsappInput) {
  const reports = parseRpText(rpWhatsappText(input));
  assert.equal(reports.length, 1);
  return reports[0]!;
}

describe("rpWhatsappText lido de volta pelo leitor do WhatsApp", () => {
  it("RP completo volta com os mesmos campos e sem avisos", () => {
    const input = fullRp();
    const rp = roundTrip(input);
    assert.deepEqual(rp.warnings, []);
    assert.equal(rp.date, "2026-10-04");
    assert.deepEqual([rp.line, rp.tag, rp.orderNumber], [input.line, input.tag, input.orderNumber]);
    assert.deepEqual([rp.problem, rp.description, rp.rootCause], [input.problem, input.description, input.rootCause]);
    assert.deepEqual([rp.corrective, rp.preventive, rp.basicConditionImpact], [input.corrective, input.preventive, input.basicConditionImpact]);
    assert.deepEqual([rp.repeatedFailure, rp.repeatedTimes, rp.repeatedPeriod], [true, "3", "última semana"]);
    assert.deepEqual(rp.causes, input.causes);
    assert.equal(rp.status, "monitoring");
    assert.deepEqual(rp.technicians, input.technicians);
  });

  it("campos vazios voltam vazios", () => {
    const input = { ...fullRp(), orderNumber: null, description: null, preventive: null, basicConditionImpact: null, repeatedFailure: false, line: null };
    const rp = roundTrip(input);
    assert.deepEqual([rp.orderNumber, rp.description, rp.preventive, rp.basicConditionImpact, rp.line], [null, null, null, null, null]);
    assert.deepEqual([rp.repeatedFailure, rp.repeatedTimes, rp.repeatedPeriod], [false, null, null]);
  });

  it("cada status volta marcado", () => {
    for (const status of ["analysis", "corrected", "monitoring", "producing"] as const) {
      assert.equal(roundTrip({ ...fullRp(), status }).status, status);
    }
  });
});
