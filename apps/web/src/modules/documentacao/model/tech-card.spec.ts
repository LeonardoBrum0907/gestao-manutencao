import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TechCardHit } from "@manutencao/shared";
import { bodyFromValues, emptyCardValues, formatBytes, sourceLabel, valuesFromCard } from "./tech-card";

const card: TechCardHit = {
  id: "c1",
  type: "part",
  equipmentId: "e1",
  machineId: null,
  lineId: null,
  subassemblyId: "s1",
  code: "938580",
  title: "Servomotor",
  summary: "",
  details: { quantity: "3", unit: "ST" },
  deviceTag: null,
  originalTerm: "Servomotor",
  tags: ["Ciclóide", "Acionamento"],
  documentId: "d1",
  page: 695,
  sheet: null,
  reviewNeeded: false,
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
  scopeLabel: "Modelo C 2504",
  subassemblyName: "Ciclóide",
  documentName: "Catálogo C 2504",
  exact: false,
};

describe("formulário da ficha", () => {
  it("vai e volta sem perder nada", () => {
    const values = valuesFromCard(card, "");
    assert.equal(values.scopeKind, "equipment");
    assert.equal(values.targetId, "e1");
    assert.equal(values.tags, "Ciclóide, Acionamento");
    assert.equal(values.page, "695");
    const { id: _id, createdAt: _c, updatedAt: _u, scopeLabel: _s, subassemblyName: _n, documentName: _d, exact: _e, ...fields } = card;
    assert.deepEqual(bodyFromValues(values), fields);
  });

  it("só o alvo escolhido vai preenchido e a linha da máquina vem do cadastro", () => {
    const values = valuesFromCard({ ...card, equipmentId: null, machineId: "m1" }, "l1");
    assert.equal(values.scopeKind, "machine");
    assert.equal(values.lineId, "l1");
    const body = bodyFromValues({ ...values, scopeKind: "line", targetId: "l1" });
    assert.deepEqual([body.equipmentId, body.machineId, body.lineId], [null, null, "l1"]);
  });

  it("limpa etiquetas repetidas, campos vazios e página inválida", () => {
    const body = bodyFromValues({
      ...emptyCardValues({ scopeKind: "machine", targetId: "m1", lineId: "l1", type: "error_code" }),
      code: " 127 ",
      title: " Verbund ",
      details: { meaning: " Sem resposta ", cause: "  " },
      tags: "Rede, rede, , Elétrica",
      page: "abc",
    });
    assert.equal(body.code, "127");
    assert.equal(body.machineId, "m1");
    assert.deepEqual(body.details, { meaning: "Sem resposta" });
    assert.deepEqual(body.tags, ["Rede", "rede", "Elétrica"]);
    assert.equal(body.page, null);
  });

  it("fonte e tamanho legíveis", () => {
    assert.equal(sourceLabel(card), "Catálogo C 2504 · p. 695");
    assert.equal(sourceLabel({ documentName: "Esquema", page: null, sheet: "166" }), "Esquema · folha 166");
    assert.equal(sourceLabel({ documentName: null, page: null, sheet: null }), null);
    assert.equal(formatBytes(500), "500 B");
    assert.equal(formatBytes(50_331_648), "48 MB");
    assert.equal(formatBytes(1_572_864), "1.5 MB");
  });
});
