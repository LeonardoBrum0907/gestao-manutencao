import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { recordRemovalWarnings } from "./record-removal";

describe("exclusão de registro", () => {
  it("sem vínculo não avisa nada", () => {
    assert.deepEqual(recordRemovalWarnings({ rp: null, attachments: 0, chamadoTasks: 0, chamadoRp: false, memberNames: [] }), []);
  });

  it("avisa o RP que vai junto e as pós-preventivas que perdem a ligação", () => {
    assert.deepEqual(recordRemovalWarnings({ rp: { orderNumber: "1234", postPreventives: 2 }, attachments: 0, chamadoTasks: 0, chamadoRp: false, memberNames: [] }), [
      "Este problema veio de um RP: o RP da OS 1234 é excluído junto.",
      "2 pós-preventivas perdem a ligação com esse RP.",
    ]);
    assert.deepEqual(recordRemovalWarnings({ rp: { orderNumber: null, postPreventives: 0 }, attachments: 0, chamadoTasks: 0, chamadoRp: false, memberNames: [] }), [
      "Este problema veio de um RP: o RP é excluído junto.",
    ]);
  });

  it("avisa anexos e de quem sai do histórico", () => {
    assert.deepEqual(recordRemovalWarnings({ rp: null, attachments: 1, chamadoTasks: 0, chamadoRp: false, memberNames: ["Ana"] }), [
      "1 anexo é apagado junto.",
      "Sai do histórico de Ana.",
    ]);
    assert.deepEqual(recordRemovalWarnings({ rp: null, attachments: 3, chamadoTasks: 0, chamadoRp: false, memberNames: ["Ana", "Bruno", "Caio"] }), [
      "3 anexos são apagados junto.",
      "Sai do histórico de Ana, Bruno e Caio.",
    ]);
  });

  it("avisa que pendência e RP do chamado continuam", () => {
    assert.deepEqual(recordRemovalWarnings({ rp: null, attachments: 0, chamadoTasks: 2, chamadoRp: true, memberNames: [] }), [
      "2 pendências geradas dele continuam, sem a ligação com o chamado.",
      "O RP escrito a partir dele continua, sem a ligação com o chamado.",
    ]);
  });
});
