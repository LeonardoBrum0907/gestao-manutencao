import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { attentionSheetPath, parseAttentionSections } from "./attention-sheet-sections";

describe("partes da folha de pós-preventiva", () => {
  it("lê só as partes conhecidas, na ordem da folha", () => {
    assert.deepEqual(parseAttentionSections("acao,xyz,ponto", true), ["ponto", "acao"]);
  });

  it("sem pedido válido, a ficha única sai completa e a da máquina sai sem feito e técnicos", () => {
    assert.deepEqual(parseAttentionSections(null, true), ["ponto", "ocorrencia", "acao", "feito", "tecnicos", "conferencia"]);
    assert.deepEqual(parseAttentionSections("nada", false), ["ponto", "ocorrencia", "acao", "conferencia"]);
  });

  it("monta o endereço da ficha única e omite secoes quando vai tudo", () => {
    assert.equal(attentionSheetPath("m1", "f1", ["tecnicos", "ponto"]), "/maquinas/m1/folha?ficha=f1&secoes=ponto%2Ctecnicos");
    assert.equal(attentionSheetPath("m1", "f1", ["ponto", "ocorrencia", "acao", "feito", "tecnicos", "conferencia"]), "/maquinas/m1/folha?ficha=f1");
  });

  it("na folha da máquina, o padrão não leva secoes e o resto leva", () => {
    assert.equal(attentionSheetPath("m1", null, ["ponto", "ocorrencia", "acao", "conferencia"]), "/maquinas/m1/folha");
    assert.equal(attentionSheetPath("m1", null, ["ponto", "tecnicos"]), "/maquinas/m1/folha?secoes=ponto%2Ctecnicos");
  });
});
