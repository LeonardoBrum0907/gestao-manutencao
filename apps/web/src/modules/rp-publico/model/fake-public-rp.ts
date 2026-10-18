import type { PublicRpDirectoryDto, PublicRpDto } from "@manutencao/shared";

// Dados de exemplo para os testes das regras da página pública.

const noCause = { marked: false, text: null };

export const sampleDirectory: PublicRpDirectoryDto = {
  factories: [{ id: "f1", name: "Fábrica 1" }],
  lines: [{ id: "l1", name: "Cam 08", internalCode: null, factoryId: "f1" }],
  machines: [{ id: "mq1", name: "Blistadeira", tag: "EBS-BLI-31", lineId: "l1" }],
  members: [{ id: "m1", name: "Rogério B" }],
};

/**
 * RP público de exemplo, aprovado, com o que o teste quiser trocar.
 * @example samplePublicRp({ status: "corrected" })
 */
export function samplePublicRp(overrides: Partial<PublicRpDto> = {}): PublicRpDto {
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
    causes: { material: noCause, machine: noCause, method: noCause, labor: noCause },
    rootCause: null,
    corrective: null,
    preventive: null,
    status: "analysis",
    basicConditionImpact: null,
    memberIds: ["m1"],
    memberNames: ["Rogério B"],
    approved: true,
    reviewRequest: null,
    reviewRequestedAt: null,
    createdAt: "2026-10-04T12:00:00.000Z",
    updatedAt: "2026-10-04T12:00:00.000Z",
    ...overrides,
  };
}
