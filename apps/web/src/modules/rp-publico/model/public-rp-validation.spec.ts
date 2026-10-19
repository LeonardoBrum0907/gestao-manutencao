import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PublicRpDirectoryDto } from "@manutencao/shared";
import { newPublicValues } from "./public-rp";
import { machineRequired, publicRpFormErrors } from "./public-rp-validation";

const machines: PublicRpDirectoryDto["machines"] = [{ id: "mq1", name: "Blistadeira", tag: "EBS-BLI-31", lineId: "l1" }];

const filled = {
  ...newPublicValues("m1"),
  occurredAt: "2026-10-18",
  factoryId: "f1",
  line: "Cam 08",
  tag: "EBS-BLI-31",
  problem: "Esteira travando",
  description: "Correia frouxa",
  rootCause: "Tensor gasto",
  corrective: "Troca do tensor",
  preventive: "- Incluir tensor na preventiva",
  basicConditionImpact: "Sem impacto",
};

describe("publicRpFormErrors", () => {
  it("formulário completo não tem erro", () => {
    assert.deepEqual(publicRpFormErrors(filled, machines), {});
  });

  it("um erro por campo obrigatório vazio", () => {
    const empty = { ...filled, occurredAt: "", factoryId: "", problem: "  ", memberIds: [], line: "", tag: "" };
    const errors = publicRpFormErrors({ ...empty, description: "", rootCause: "", corrective: "", preventive: "", basicConditionImpact: "" }, machines);
    const expected = ["basicConditionImpact", "corrective", "description", "factoryId", "line", "memberIds", "occurredAt", "preventive", "problem", "rootCause", "tag"];
    assert.deepEqual(Object.keys(errors).sort(), expected);
    assert.equal(errors.memberIds, "Escolha pelo menos um técnico.");
  });

  it("4M e ordem continuam opcionais", () => {
    assert.deepEqual(publicRpFormErrors({ ...filled, orderNumber: "" }, machines), {});
  });

  it("texto longo demais diz o tamanho recebido e o máximo", () => {
    const errors = publicRpFormErrors({ ...filled, rootCause: "x".repeat(2001), tag: "t".repeat(121) }, machines);
    assert.equal(errors.rootCause, "Passou do tamanho: 2001 caracteres (máximo 2000).");
    assert.equal(errors.tag, "Passou do tamanho: 121 caracteres (máximo 120).");
  });
});

describe("máquina obrigatória", () => {
  it("só quando a linha do cadastro tem máquina para escolher", () => {
    assert.equal(machineRequired({ ...filled, lineId: "l1" }, machines), true);
    assert.equal(machineRequired({ ...filled, lineId: "l2" }, machines), false);
    assert.equal(machineRequired({ ...filled, lineId: "" }, machines), false);
  });

  it("pede a máquina na linha que tem lista", () => {
    assert.equal(publicRpFormErrors({ ...filled, lineId: "l1", machineId: "" }, machines).machineId, "Escolha a máquina.");
    assert.equal(publicRpFormErrors({ ...filled, lineId: "l1", machineId: "mq1" }, machines).machineId, undefined);
  });
});
