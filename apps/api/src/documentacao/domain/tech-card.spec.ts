import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { readDetails, readScope, readTags, readTechCardFields } from "./tech-card";

function rejects(run: () => unknown, part: string) {
  assert.throws(run, (error: unknown) => error instanceof DomainError && error.statusCode === 400 && error.message.includes(part));
}

const part = { type: "part", equipmentId: "e1", code: " 938580 ", title: "Servomotor", details: { quantity: "3", unit: "ST" }, tags: ["Ciclóide"] };

describe("ficha de documentação", () => {
  it("lê uma peça do modelo com os campos do tipo", () => {
    const fields = readTechCardFields(part);
    assert.equal(fields.type, "part");
    assert.deepEqual([fields.equipmentId, fields.machineId, fields.lineId], ["e1", null, null]);
    assert.equal(fields.code, "938580");
    assert.deepEqual(fields.details, { quantity: "3", unit: "ST" });
    assert.deepEqual(fields.tags, ["Ciclóide"]);
    assert.equal(fields.summary, "");
    assert.equal(fields.reviewNeeded, false);
  });

  it("exige exatamente um alvo: modelo, máquina ou linha", () => {
    rejects(() => readScope({}), "exatamente um");
    rejects(() => readScope({ machineId: "m1", lineId: "l1" }), "exatamente um");
    assert.deepEqual(readScope({ lineId: "l1" }), { equipmentId: null, machineId: null, lineId: "l1" });
  });

  it("recusa tipo desconhecido e campo que não é do tipo", () => {
    rejects(() => readTechCardFields({ ...part, type: "manual" }), "não existe");
    rejects(() => readDetails("part", { meaning: "x" }), "Campos: quantity, unit, position, notes");
    rejects(() => readDetails("part", "texto"), "objeto");
    assert.deepEqual(readDetails("part", { quantity: " 3 ", notes: "" }), { quantity: "3" });
  });

  it("código é obrigatório para erro e peça, livre nos outros", () => {
    rejects(() => readTechCardFields({ ...part, code: "" }), "nº da peça");
    rejects(() => readTechCardFields({ type: "error_code", lineId: "l1", title: "Verbund" }), "código do erro");
    assert.equal(readTechCardFields({ type: "interface", lineId: "l1", title: "CP600 → P3200" }).code, null);
  });

  it("página pede documento e precisa ser inteiro a partir de 1", () => {
    rejects(() => readTechCardFields({ ...part, page: 12 }), "documentId");
    rejects(() => readTechCardFields({ ...part, documentId: "d1", page: 0 }), "Página inválida");
    assert.equal(readTechCardFields({ ...part, documentId: "d1", page: "694" }).page, 694);
    assert.equal(readTechCardFields({ ...part, documentId: "d1" }).page, null);
  });

  it("etiquetas sem repetição nem vazias", () => {
    assert.deepEqual(readTags(["Rede", " rede ", "", "Elétrica"]), ["Rede", "Elétrica"]);
    rejects(() => readTags("Rede"), "lista");
  });
});
