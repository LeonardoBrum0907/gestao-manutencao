import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sheetRedirect } from "./sheet-redirect";

const occurredAt = "2026-10-14T21:11:00.000Z";
const memberId = null;

describe("para onde a ficha do registro manda", () => {
  it("chamado abre a lista do dia dele, no fuso do gestor", () => {
    assert.equal(sheetRedirect({ id: "c1", type: "problem", origin: "chamado", occurredAt, memberId }), "/turno/chamados?dia=2026-10-14&abrir=c1");
  });

  it("registro da Entrada abre no modal da lista do tipo dele", () => {
    assert.equal(sheetRedirect({ id: "t1", type: "task", origin: "inbox", occurredAt, memberId }), "/registros?tipo=tarefas&situacao=todos&registro=t1");
    assert.equal(sheetRedirect({ id: "e1", type: "entry", origin: "inbox", occurredAt, memberId }), "/entrada?registro=e1");
  });

  it("ocorrência fica na própria ficha", () => {
    assert.equal(sheetRedirect({ id: "o1", type: "problem", origin: "ocorrencia", occurredAt, memberId }), null);
  });

  // Antes, o problema de RP parava numa página "RP" sem o texto do problema, só com o link "Abrir o RP".
  it("problema de RP abre direto a ficha do RP", () => {
    assert.equal(sheetRedirect({ id: "p1", type: "problem", origin: "rp", occurredAt, memberId }, "rp9"), "/rp/rp9");
  });

  it("problema de RP fica na ficha enquanto o RP não é achado", () => {
    assert.equal(sheetRedirect({ id: "p1", type: "problem", origin: "rp", occurredAt, memberId }), null);
  });

  it("observação da ficha abre no histórico da ficha do colaborador", () => {
    const record = { id: "f1", type: "feedback", origin: "ficha", occurredAt, memberId: "m1" } as const;
    assert.equal(sheetRedirect(record), "/cadastro/colaboradores/m1/comportamento?registro=f1");
  });
});
