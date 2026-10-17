import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubassemblyDto } from "@manutencao/shared";
import { emptyValues, formChanged, subassemblyFilterOptions } from "./post-preventive";

function sub(id: string, scope: Partial<SubassemblyDto> = {}): SubassemblyDto {
  return { id, equipmentId: "blis", machineId: null, name: id, archived: false, ...scope };
}

describe("opções do filtro Subconjunto da lista de pós-preventiva", () => {
  const all = [
    sub("modelo"),
    sub("so-m1", { machineId: "m1" }),
    sub("so-m2", { machineId: "m2" }),
    sub("arquivado", { archived: true }),
    sub("desmarcado"),
    sub("outro-modelo", { equipmentId: "enc" }),
  ];
  const machine = { id: "m1", equipmentId: "blis", hiddenSubassemblyIds: ["desmarcado"] };

  it("tira os subconjuntos só de outra máquina do mesmo modelo e os de outro modelo", () => {
    const ids = subassemblyFilterOptions(all, machine).map((item) => item.id);
    assert.deepEqual(ids, ["modelo", "so-m1", "arquivado", "desmarcado"]);
  });

  it("fica vazio sem máquina escolhida ou com máquina sem modelo", () => {
    assert.deepEqual(subassemblyFilterOptions(all, undefined), []);
    assert.deepEqual(subassemblyFilterOptions(all, { ...machine, equipmentId: null }), []);
  });
});

describe("mudança não gravada na ficha pós-preventiva", () => {
  const saved = { ...emptyValues("2026-10-10"), attentionPoint: "Medir temperatura da placa", memberIds: ["m1"] };

  it("sem mudança, ou com o mesmo texto digitado de novo, não há o que gravar", () => {
    assert.equal(formChanged(saved, { ...saved, memberIds: ["m1"] }), false);
  });

  it("acusa texto, técnicos e caixa de seleção mudados", () => {
    assert.equal(formChanged(saved, { ...saved, attentionPoint: "Medir temperatura e o termopar" }), true);
    assert.equal(formChanged(saved, { ...saved, memberIds: ["m1", "m2"] }), true);
    assert.equal(formChanged(saved, { ...saved, attentionActive: false }), true);
  });
});
