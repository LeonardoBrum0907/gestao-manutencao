import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { parseDay, readPostPreventive } from "./post-preventive";

const valid = {
  preventiveDate: "2026-09-19",
  occurrenceDate: "",
  machineId: "maq",
  subassemblyId: "sub",
  memberIds: ["ana", "ana", "beto"],
  done: " Trocadas as válvulas roletes pelas revisadas ",
  occurrence: "Quebrou o cilindro de atuação",
  preventiveAction: "Procedimento de check das válvulas antes de montar",
  attentionPoint: "Conferir se as válvulas não estão travadas",
};

function refused(run: () => void, message: string) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.message, message);
    return true;
  });
}

describe("ficha pós-preventiva", () => {
  it("lê a ficha, limpa espaços, junta técnicos repetidos e começa com o ponto ativo", () => {
    const fields = readPostPreventive(valid);
    assert.equal(fields.done, "Trocadas as válvulas roletes pelas revisadas");
    assert.deepEqual(fields.memberIds, ["ana", "beto"]);
    assert.equal(fields.occurrenceDate, null);
    assert.equal(fields.attentionActive, true);
    assert.equal(fields.rpId, null);
  });

  it("exige técnico e ponto de atenção", () => {
    refused(() => readPostPreventive({ ...valid, memberIds: [] }), "Escolha ao menos um técnico.");
    refused(() => readPostPreventive({ ...valid, attentionPoint: "  " }), "Informe o ponto de atenção.");
  });

  it("recusa ocorrência antes da preventiva", () => {
    refused(() => readPostPreventive({ ...valid, occurrenceDate: "2026-09-18" }), "A ocorrência não pode ser antes da preventiva.");
  });

  it("recusa dia que não existe", () => {
    refused(() => parseDay("2026-02-31", "Data inválida."), "Data inválida.");
  });
});
