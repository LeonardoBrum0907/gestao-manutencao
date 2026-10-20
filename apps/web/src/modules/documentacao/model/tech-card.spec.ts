import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TechCardHit } from "@manutencao/shared";
import { bodyFromValues, emptyCardValues, formatBytes, missingScopeTarget, sourceLabel, valuesFromCard, withDocument, withMachineLine, withScopeKind } from "./tech-card";

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

  // Regressão: o "Vale para" voltava para Modelo porque a troca era feita em quatro set() seguidos.
  it("trocar o Vale para muda o escopo e limpa o que era da escolha anterior", () => {
    const before = { ...emptyCardValues({ targetId: "e1" }), subassemblyId: "s1", documentId: "d1", title: "Servomotor" };
    const after = withScopeKind(before, "machine");
    assert.equal(after.scopeKind, "machine");
    assert.deepEqual([after.targetId, after.subassemblyId, after.documentId], ["", "", ""]);
    assert.equal(after.title, "Servomotor");
  });

  // Regressão: a página ficava no campo travado ao tirar o documento e a API recusava com "A página precisa do documento (documentId)".
  it("tirar o documento limpa a página, que só vale com documento", () => {
    const before = { ...emptyCardValues({ targetId: "e1" }), documentId: "d1", page: "12", sheet: "166" };
    const after = withDocument(before, "");
    assert.deepEqual([after.documentId, after.page, after.sheet], ["", "", "166"]);
    assert.equal(bodyFromValues(after).page, null);
  });

  it("trocar de documento guarda a página digitada", () => {
    const before = { ...emptyCardValues({ targetId: "e1" }), documentId: "d1", page: "12" };
    assert.deepEqual([withDocument(before, "d2").documentId, withDocument(before, "d2").page], ["d2", "12"]);
  });

  it("trocar o Vale para solta o documento e a página junto", () => {
    const before = { ...emptyCardValues({ targetId: "e1" }), documentId: "d1", page: "12" };
    assert.deepEqual([withScopeKind(before, "line").documentId, withScopeKind(before, "line").page], ["", ""]);
  });

  it("trocar a linha da máquina guarda a linha e solta a máquina da linha anterior", () => {
    const before = emptyCardValues({ scopeKind: "machine", targetId: "m1", lineId: "l1" });
    const after = withMachineLine(before, "l2");
    assert.deepEqual([after.scopeKind, after.lineId, after.targetId], ["machine", "l2", ""]);
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

// Antes a tela mostrava a mensagem da API para a IA ("equipmentId, machineId ou lineId").
describe("o que falta escolher no Vale para", () => {
  it("diz o modelo, a máquina ou a linha conforme o Vale para", () => {
    assert.equal(missingScopeTarget(emptyCardValues()), "Falta escolher o modelo de equipamento.");
    assert.equal(missingScopeTarget(emptyCardValues({ scopeKind: "machine", lineId: "l1" })), "Falta escolher a máquina.");
    assert.equal(missingScopeTarget(emptyCardValues({ scopeKind: "line" })), "Falta escolher a linha.");
  });

  it("não reclama quando o alvo está escolhido", () => {
    assert.equal(missingScopeTarget(emptyCardValues({ scopeKind: "machine", targetId: "m1", lineId: "l1" })), null);
  });
});
