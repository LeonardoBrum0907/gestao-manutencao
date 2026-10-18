import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PublicRpDirectoryDto, PublicRpDto } from "@manutencao/shared";
import { publicRpWhatsappText } from "./public-rp-whatsapp";

const empty = { marked: false, text: null };
const lines: PublicRpDirectoryDto["lines"] = [{ id: "l1", name: "Cam 08", internalCode: null, factoryId: "f1" }];

function sampleRp(overrides: Partial<PublicRpDto> = {}): PublicRpDto {
  return {
    id: "rp1",
    occurredAt: "2026-10-04T12:00:00.000Z",
    orderNumber: null,
    factoryId: "f1",
    lineId: "l1",
    line: "cam8",
    tag: "EBS-BLI-31",
    machineId: null,
    problem: "Alarme na esteira.",
    description: null,
    repeatedFailure: false,
    repeatedTimes: null,
    repeatedPeriod: null,
    causes: { material: empty, machine: empty, method: empty, labor: empty },
    rootCause: null,
    corrective: null,
    preventive: null,
    status: "analysis",
    basicConditionImpact: null,
    memberIds: ["m1"],
    memberNames: ["Rogério B"],
    reviewRequest: null,
    reviewRequestedAt: null,
    createdAt: "2026-10-04T12:00:00.000Z",
    updatedAt: "2026-10-04T12:00:00.000Z",
    ...overrides,
  };
}

describe("publicRpWhatsappText", () => {
  it("usa o nome da linha do cadastro e os nomes dos técnicos", () => {
    const text = publicRpWhatsappText(sampleRp(), lines);
    assert.match(text, /\*LINHA:\* Cam 08\n/);
    assert.match(text, /\*TÉCNICO:\* Rogério B\n/);
  });

  it("sem linha do cadastro, usa a linha escrita à mão", () => {
    assert.match(publicRpWhatsappText(sampleRp({ lineId: null, line: "Linha nova" }), lines), /\*LINHA:\* Linha nova\n/);
  });
});
