import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rpPasteWarningFields } from "./rp-paste-warnings";

describe("rpPasteWarningFields: o campo que resolve cada aviso do Colar", () => {
  it("liga os avisos de data, linha, status, problema e técnico ao campo deles", () => {
    assert.deepEqual(rpPasteWarningFields("Data não encontrada: confira a data."), ["occurredAt"]);
    assert.deepEqual(rpPasteWarningFields("Data sem ano: usei 2026. Confira a data."), ["occurredAt"]);
    assert.deepEqual(rpPasteWarningFields("Linha não encontrada no cadastro: ficou só com a linha e a TAG do texto."), ["lineId", "factoryId"]);
    assert.deepEqual(rpPasteWarningFields("Status não marcado: ficou em análise."), ["status"]);
    assert.deepEqual(rpPasteWarningFields("Não encontrei o problema: preencha antes de salvar."), ["problem"]);
    assert.deepEqual(rpPasteWarningFields("Técnico não encontrado no cadastro: Zé."), ["memberIds"]);
  });

  it("aviso da TAG de outra linha se resolve na linha, na máquina ou na TAG", () => {
    assert.deepEqual(rpPasteWarningFields("A TAG EBS-BLI-21 é da Blistadeira da MED 06, mas a linha lida foi CAM 07."), ["lineId", "machineId", "tag"]);
  });

  it("aviso sem campo fica sem lista", () => {
    assert.deepEqual(rpPasteWarningFields("O texto tem 2 relatórios: preenchi o primeiro."), []);
  });
});
