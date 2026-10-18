import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rpWhatsappText, type RpWhatsappInput } from "./rp-whatsapp";

const empty = { marked: false, text: null };

function sample(overrides: Partial<RpWhatsappInput> = {}): RpWhatsappInput {
  return {
    occurredAt: "2026-10-04T12:00:00.000Z",
    line: "Cam 08",
    tag: "EBS-BLI-31",
    orderNumber: null,
    problem: "Alarme de posição na esteira.",
    description: null,
    repeatedFailure: false,
    repeatedTimes: null,
    repeatedPeriod: null,
    causes: { material: empty, machine: { marked: true, text: "FERRAMENTAL" }, method: { marked: true, text: null }, labor: empty },
    rootCause: "Parâmetros desajustados.",
    corrective: "Esticada a esteira.\n- Ajustados os parâmetros.",
    preventive: null,
    status: "corrected",
    technicians: ["Rogério B", "Douglas"],
    basicConditionImpact: null,
    ...overrides,
  };
}

describe("rpWhatsappText: texto do RP no modelo do grupo", () => {
  it("abre com o título e a data em dd/mm/aaaa", () => {
    const lines = rpWhatsappText(sample()).split("\n");
    assert.equal(lines[0], "*RELATÓRIO PADRÃO – MANUTENÇÃO*");
    assert.equal(lines[2], "*DATA:* 04/10/2026");
    assert.equal(lines[5], "*ORDEM:*");
  });

  it("cada linha do texto longo vira um item, sem marcador dobrado", () => {
    const text = rpWhatsappText(sample());
    assert.match(text, /\*CONTRAMEDIDA CORRETIVA \(o que foi feito agora\?\):\*\n- Esticada a esteira\.\n- Ajustados os parâmetros\.\n/);
  });

  it("marca o 4M com X e o detalhe entre parênteses", () => {
    const text = rpWhatsappText(sample());
    assert.match(text, /- \*MÁQUINA:\* X \(FERRAMENTAL\)\n- \*MÉTODO:\* X\n/);
    assert.match(text, /- \*MATERIAL:\*\n/);
  });

  it("marca só o status do RP e a falha repetida com vezes e período", () => {
    const text = rpWhatsappText(sample({ status: "monitoring", repeatedFailure: true, repeatedTimes: "3", repeatedPeriod: "1 semana" }));
    assert.match(text, /\( \) Corrigido\n\(X\) Em monitoramento\n/);
    assert.match(text, /\( \) Não\n\(X\) Sim → Quantas vezes\? 3\nPeríodo aproximado: 1 semana\n/);
  });

  it("junta os técnicos com vírgula", () => {
    assert.match(rpWhatsappText(sample()), /\*TÉCNICO:\* Rogério B, Douglas\n/);
  });
});
