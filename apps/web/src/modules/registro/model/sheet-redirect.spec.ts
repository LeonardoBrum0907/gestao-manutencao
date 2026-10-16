import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sheetRedirect } from "./sheet-redirect";

const occurredAt = "2026-10-14T21:11:00.000Z";

describe("para onde a ficha do registro manda", () => {
  it("chamado abre a lista do dia dele, no fuso do gestor", () => {
    assert.equal(sheetRedirect({ id: "c1", type: "problem", origin: "chamado", occurredAt }), "/turno/chamados?dia=2026-10-14&abrir=c1");
  });

  it("registro da Entrada abre no modal da lista do tipo dele", () => {
    assert.equal(sheetRedirect({ id: "t1", type: "task", origin: "inbox", occurredAt }), "/registros?tipo=tarefas&situacao=todos&registro=t1");
    assert.equal(sheetRedirect({ id: "e1", type: "entry", origin: "inbox", occurredAt }), "/entrada?registro=e1");
  });

  it("ocorrência fica na própria ficha", () => {
    assert.equal(sheetRedirect({ id: "o1", type: "problem", origin: "ocorrencia", occurredAt }), null);
  });

  // Antes, o problema de RP parava numa página "RP" sem o texto do problema, só com o link "Abrir o RP".
  it("problema de RP abre direto a ficha do RP", () => {
    assert.equal(sheetRedirect({ id: "p1", type: "problem", origin: "rp", occurredAt }, "rp9"), "/rp/rp9");
  });

  it("problema de RP fica na ficha enquanto o RP não é achado", () => {
    assert.equal(sheetRedirect({ id: "p1", type: "problem", origin: "rp", occurredAt }), null);
  });
});
